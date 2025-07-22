const MAX_TEXT_CHUNK_LENGTH = 2000; // 你可以根据需要调整这个值

export function splitText(
  text: string = "",
  maxLength: number = MAX_TEXT_CHUNK_LENGTH
): string[] {
  const paragraphs = text.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 1 <= maxLength) {
      // +1 是为了加上换行符
      currentChunk += (currentChunk.length > 0 ? "\n" : "") + paragraph;
    } else {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      currentChunk = paragraph;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export function removeJsonMarkdown(text: string) {
  text = text.trim();
  if (text.startsWith("```json")) {
    text = text.slice(7);
  } else if (text.startsWith("json")) {
    text = text.slice(4);
  } else if (text.startsWith("```")) {
    text = text.slice(3);
  }
  if (text.endsWith("```")) {
    text = text.slice(0, -3);
  }
  return text.trim();
}

/**
 * Check if a text contains XML or HTML tags.
 * Consider various scenarios, including:
 * - Regular tags (such as <p>, <div>)
 * - Tags with attributes (such as <a href="...">)
 * - Self-closing tags (such as <img />, <br>)
 * - Closed tags (such as </p>)
 * - XML/HTML comments (such as <!-- ... -->)
 * - XML ​​processing instructions (such as <?xml ... ?>)
 * - CDATA sections (such as <![CDATA[ ... ]]> )
 * - DOCTYPE declarations (such as <!DOCTYPE html>)
 *
 * Note: This method is a fast detection based on pattern matching, not a complete parser.
 * It may misjudge some non-tag but similarly structured text as tags, but it is sufficient in most detection scenarios.
 * Strict validation requires a full parser.
 *
 * @param text The text to be detected
 * @returns Returns true if the text contains any structure that looks like an XML/HTML tag, otherwise returns false.
 */
export function containsXmlHtmlTags(text: string): boolean {
  // Check if the input is a string and is not empty
  if (typeof text !== "string" || text.length === 0) {
    return false;
  }

  // Build regular expressions to match various possible tag structures
  // This regular expression tries to cover common XML/HTML structures:
  // 1. <!--.*?--> : matches HTML/XML comments (non-greedy matching)
  // 2. <![CDATA[.*?]]> : matches CDATA sections (non-greedy matching)
  // 3. <!DOCTYPE[^>]*?> : matches DOCTYPE declarations (non-greedy matching)
  // 4. <\?.*?\?> : matches XML processing instructions (e.g. <?xml ... ?>) (non-greedy matching)
  // 5. <[!\/]?[a-zA-Z][^>]*?> : matches normal tags, tags with attributes, self-closing tags, closing tags, and <!ELEMENT>, etc.
  // < : matches '<'
  // [!\/]? : optional '!' (for <!ELEMENT>) or '/' (for closing tags)
  // [a-zA-Z] : tag names start with letters (XML/HTML standard)
  // [^>]*? : non-greedy matches any non-'>' character (remaining part of tag name, attributes, self-closing '/')
  // > : matches '>'
  //
  // Use the 'i' flag for case-insensitive matching (HTML tag names and attribute names are usually case-insensitive)
  // Use the 'test()' method, which only needs to find the first match to return true, which is more efficient
  const xmlHtmlTagRegex =
    /(<!--.*?-->|<!\[CDATA\[.*?]]>|<!DOCTYPE[^>]*?>|<\?.*?\?>|<[!\/]?[a-zA-Z][^>]*?>)/i;

  return xmlHtmlTagRegex.test(text);
}

/**
 * 这是一个自定义的流处理器类，用于处理带有<think>标签的文本流
 * 主要用途是处理AI思考过程中的输出，可以区分思考内容和最终内容
 * 这是项目作者自定义实现的，不是SDK或API自带的功能
 */
export class ThinkTagStreamProcessor {
  private buffer: string = "";
  private hasSkippedThinkBlock: boolean = false;

  /**
   * Process the received text block.
   * @param chunk The received text block.
   * @param outputCallback The callback function called when there is non-thinking content to be output.
   */
  /**
   * 处理接收到的文本块
   * @param chunk 接收到的文本块
   * @param contentOutput 用于输出非思考内容的回调函数
   * @param thinkingOutput 可选的用于输出思考内容的回调函数
   */
  processChunk(
    chunk: string,
    contentOutput: (data: string) => void,
    thinkingOutput?: (data: string) => void
  ): void {
    // 如果已经跳过了think块，所有新数据直接输出
    if (this.hasSkippedThinkBlock) {
      contentOutput(chunk);
      return;
    }

    // 将新块添加到缓冲区，继续寻找或处理think块
    this.buffer += chunk;

    // 检查是否以<think>标签开始
    const startTag = this.buffer.startsWith("<think>");
    // 查找</think>结束标签的位置
    const endTagIndex = this.buffer.indexOf("</think>");

    if (startTag) {
      // 如果找到了结束标签
      if (endTagIndex !== -1) {
        // 提取</think>标签之后的内容
        const contentAfterThink = this.buffer.substring(
          endTagIndex + "</think>".length
        );

        // 如果有内容，输出think标签之后的内容
        if (contentAfterThink.length > 0) {
          contentOutput(contentAfterThink);
        }

        // 标记think块已处理完成，清空缓冲区
        this.hasSkippedThinkBlock = true;
        this.buffer = "";
      } else {
        // 如果没找到结束标签，且提供了思考输出回调，则输出当前块
        if (thinkingOutput) thinkingOutput(chunk);
      }
    } else {
      // 如果不是以<think>开始，直接输出内容
      this.hasSkippedThinkBlock = true;
      contentOutput(chunk);
    }
  }

  /**
   * 重置处理器状态
   * 清空缓冲区并重置think块跳过标志
   */
  end(): void {
    this.buffer = "";
    this.hasSkippedThinkBlock = false;
  }
}
