export function getLatestProductMessageId(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user" || message?.role === "error") return null;
    if (message?.role === "assistant") {
      return message.products?.length > 0 ? message.id : null;
    }
  }
  return null;
}
