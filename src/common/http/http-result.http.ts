export class HttpResult {
  status = true;
  message: string;
  data: any;
  constructor(obj: Partial<HttpResult>) {
    Object.assign(this, obj);
  }
}
