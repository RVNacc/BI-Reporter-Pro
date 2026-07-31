(async () => {
  const res = await fetch('http://localhost:3000/api/database/export');
  console.log(res.status);
})();
