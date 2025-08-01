function getFileExtension(language) {
  const map = {
    javascript: "js",
    python: "py",
    java: "java",
    cpp: "cpp",
    c: "c"
  };
  return map[language] || "txt";
}

export default getFileExtension;