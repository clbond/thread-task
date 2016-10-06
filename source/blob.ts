export abstract class TaskBlob {
  public static encode(content: string): string {
    let blob: Blob;
    try {
      blob = new Blob([content], {type: 'application/javascript'});
    }
    catch (e) {
      const builder = TaskBlob.getBlobBuilder();
      builder.append(content);

      blob = builder.getBlob();
    }

    return URL.createObjectURL(blob);
  }

  private static getBlobBuilder(): MSBlobBuilder {
    const tries = [
      'BlobBuilder',
      'MozBlobBuilder',
      'WebKitBlobBuilder',
    ];

    const environment: any = window;

    for (const key of tries) {
      if (environment[key] != null) {
        return environment[key];
      }
    }

    return null;
  }
}
