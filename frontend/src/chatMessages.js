export function getLatestProductMessageId(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.products?.length > 0) return messages[index].id;
  }
  return null;
}
