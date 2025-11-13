gridpark.on("ready", () => {
  const sheet = gridpark.querySelector('sheet[name="Products"]');
  sheet?.classList.add("products-ready");
});
