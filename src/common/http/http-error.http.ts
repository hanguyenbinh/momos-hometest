export class HttpError {
  status = 'FAILURE';
  message: string;
  error: any;
  constructor(_message, _error = null) {
    this.message = _message;
    this.error = _error;
  }
}
