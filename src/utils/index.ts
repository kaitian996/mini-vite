import Stream from "stream"
export async function readBody(stream: string | Buffer): Promise<string> {
    if (stream instanceof Stream) {
        return new Promise((resolve, reject) => {
            let result = ''
            stream.on('data', (data: any) => {
                result += data
            })
            stream.on('end', () => {
                resolve(result)
            })
        })
    } else {
        return stream.toString()
    }
}
