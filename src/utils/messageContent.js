export function contentToText(content) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.type === "text" && typeof part.text === "string") return part.text;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return content == null ? "" : JSON.stringify(content);
}

export function getFinalAnswer(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const text = contentToText(message?.content).trim();
    const isToolMessage = message?.getType?.() === "tool" || message?._getType?.() === "tool";

    if (text && !isToolMessage) {
      return text;
    }
  }

  return "The agent completed the request but did not return a text response.";
}

export function getToolsUsed(messages = []) {
  const tools = new Set();

  for (const message of messages) {
    const calls = message?.tool_calls ?? message?.additional_kwargs?.tool_calls ?? [];
    for (const call of calls) {
      const name = call?.name ?? call?.function?.name;
      if (name) tools.add(name);
    }
  }

  return [...tools];
}
