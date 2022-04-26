import { IResponseOK } from "src/types/respOk"

function respOk<T>(message: string, data: T): IResponseOK<T> {
  return {
    message,
    data
  }
}

export default respOk