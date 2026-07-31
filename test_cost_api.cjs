(async () => {
  const res = await fetch('http://localhost:3000/api/reports/cost-allocation');
  console.log(res.status);
  const text = await res.text();
  console.log(text.substring(0, 100));
})();
