gridpark.on("ready", () => {
  const sheet = gridpark.querySelector('sheet[name="Employees"]');
  if (!sheet) return;
  sheet.classList.add("employees-ready");
});
