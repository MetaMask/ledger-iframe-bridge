export const hexToAscii = (text) => {
  return String.fromCharCode(
    ...text.match(/.{1,2}/g).map((e) => parseInt(e, 16)),
  );
};
