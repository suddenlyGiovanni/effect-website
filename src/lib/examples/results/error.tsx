import { RenderableResult } from "../domain"

export class ErrorResult extends RenderableResult {
  readonly message: string
  constructor(error: Error) {
    super()
    this.message = error.message
  }
  render(): React.ReactNode {
    return <div className="text-2xl">{this.message}</div>
  }
}
