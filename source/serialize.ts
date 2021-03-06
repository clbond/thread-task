/// The intent of serialize() is to create a function that is itself able to
/// reconstruct {@param object} into an exact clone that includes circular
/// references and objects that are not normally serializable by something like
/// {@link JSON.stringify}. It returns a string containing the code for the
/// reconstructor function. That value can be passed to a Function constructor
/// which will parse it into a function that can then be invoked to recreate
/// the original object. In this way we are able to serialize an object for
/// transmission across thread boundaries even if it is very complex and
/// contains `unserializable' constructs (like circular references). This is
/// used in our message passing operations to reliably send complex objects.

class Operation {
  arrays = new Array<any>();
  hashes = new Array<any>();
  objref = new Array<any>();
  sets   = new Array<any>();
  maps   = new Array<any>();

  /// Objects that have prototype chains other than Object.getPrototypeOf({})
  prototypes = new Array<any>();

  /// Nodes that have been visited and recorded (-> index)
  visits = new Map<any, number>();

  /// Recursion operations that we want to execute in a shallow call stack
  tails = new Array<() => void>();
}

const serializer = object => {
  switch (typeof object) {
    case 'object':
      if (object) {
        break;
      }
      // fallthrough
    case 'string':
    case 'number':
    case 'boolean':
    case 'undefined':
      return JSON.stringify(object);
    case 'function':
      return object.toString();
  }

  const operation = new Operation();

  /// Start the mapping operation at the root.
  map(operation, object);

  /// Avoid recursive operations by adding functions to tails
  while (operation.tails.length > 0) {
    const run = operation.tails.length;

    for (let index = 0; index < run; ++index) {
      operation.tails[index]();
    }

    operation.tails.splice(0, run);
  }

  /// Return a string representation of the recreator function. The result must
  /// be parseable JavaScript code that can be provided to `new Function()' to
  /// create a function that can recreate the object.
  const encode = v => JSON.stringify(v);

  return `function() {
    var _ = [${operation.objref.join(',')}];

    ${operation.arrays.map(link =>
      `_[${encode(link.source)}][${encode(link.key)}] = _[${encode(link.target)}];`).join('')}

    ${operation.hashes.map(link =>
      `_[${encode(link.source)}][${encode(link.key)}] = _[${encode(link.target)}];`).join('')}

    ${operation.maps.map(link =>
      `_[${encode(link.source)}][${encode(link.key)}] = _[${encode(link.target)}];`).join('')}

    ${operation.sets.map(link =>
      `_[${encode(link.source)}][${encode(link.key)}] = _[${encode(link.target)}];`).join('')}

    ${operation.prototypes.map(link =>
      `Object.setPrototypeOf(_[${encode(link.source)}], _[${encode(link.target)}]);`).join('')}

      return _[0];
    }();`;
};

/// Serialize a complex object into a function that can recreate the object.
export const serialize = value => `return ${serializer(value)}`;

/// Deserialize a function string and invoke the resulting object recreator.
export const deserialize = value => (new Function(value))();

function Reference(to) {
  this.source = null;
  this.target = to;
}

function map(operation: Operation, value) {
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'number':
    case 'boolean':
      return value;
    case 'undefined':
      return 'undefined';
    default:
      if (value === null) {
        return 'null';
      }

      const objectType = Object.prototype.toString.call(value);

      switch (objectType) {
        case '[object RegExp]':
          return value.toString();
        case '[object Date]':
          return `new Date(${value.valueOf()})`;
        default:
          if (/Element/.test(objectType)) {
            return null; // cannot serialize DOM elements
          }

          /// If this is a function, there is really no way to serialize
          /// it in a way that will include its original context and
          /// closures. But we do serialize the function, because this
          /// will allow people to pass functions from their tasks as
          /// long as they do not reference closures that are not accessible
          /// in the context they are running in.
          if (typeof value === 'function') {
            return value.toString();
          }

          let index = operation.visits.get(value);
          if (index != null) {
            return new Reference(index);
          }
          else {
            index = operation.visits.size;

            operation.visits.set(value, index);
          }

          const mapArray = (collection: Array<any>, array: Array<any>) => {
            return `[${array.map((i, key) => {
              const ref = map(operation, i);

              if (ref instanceof Reference) {
                ref.source = index;
                ref.key = key;

                collection.push(ref);

                return 'null';
              }

              return ref;
            })}]`;
          };

          switch (objectType) {
            case '[object Array]':
              operation.tails.push(() => {
                operation.objref[index] = mapArray(operation.arrays, value);
              });
              break;
            case '[object Set]':
              operation.tails.push(() => {
                const array = [];
                value.forEach(v => array.push(v));

                operation.objref[index] = `new Set(${mapArray(operation.sets, array)})`;
              });
              break;
            case '[object Map]':
              operation.tails.push(() => {
                const array = [];
                value.forEach((key, value) => array.push([key, value]));

                operation.objref[index] = `new Map(${mapArray(operation.maps, array)})`;
              });
              break;
            default:
              operation.tails.push(() => {
                let p = map(operation, prototype(value));

                operation.objref[index] = `{${Object.getOwnPropertyNames(value).map(key => {
                    const mapped = map(operation, value[key]);

                    if (mapped instanceof Reference) {
                      mapped.source = index;
                      mapped.key = key;

                      operation.hashes.push(mapped);

                      return mapped;
                    }

                    return `${JSON.stringify(key)}: ${mapped}`;
                  }).filter(v => v instanceof Reference === false).join(',')}}`;

                if (p instanceof Reference) {
                  operation.prototypes.push({source: index, target: p.target});
                }
              });
              break;
          }

          return new Reference(index);
      }
  }
}

const prototypeChain = object => {
  const results = [];

  const basePrototype = Object.getPrototypeOf({});

  let prototype = object;
  while (true) {
    prototype = Object.getPrototypeOf(prototype);
    if (prototype !== basePrototype) {
      results.push(prototype);
    }
    else {
      break;
    }
  }

  return results;
};

const prototype = value => {
  let object;
  let iterator;

  for (const p of prototypeChain(value)) {
    if (object == null) {
      object = iterator = p;
    }
    else {
      iterator['__proto__'] = p;
      iterator = p;
    }
  }

  return object;
};

export const functionName = (fn): string => {
  if (typeof fn !== 'function') {
    return null;
  }

  const extract = (value: string) => value.match(/^function ([^\(]*)\(/);

  let name: string = fn.name;
  if (name == null || name.length === 0) {
    const match = extract(fn.toString());

    if (match != null && match.length > 1) {
      return match[1];
    }

    return null;
  }

  return name;
};
