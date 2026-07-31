const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

if (!css.includes('page-break-inside: avoid;')) {
    css += `
@media print {
  aside { display: none !important; }
  header { display: none !important; }
  main { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
  .overflow-x-auto { overflow: visible !important; }
  table { page-break-inside: auto; width: 100% !important; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  .recharts-wrapper { max-width: 100% !important; }
  .no-print { display: none !important; }
  
  /* Scale down slightly to fit more on A4 */
  body {
    font-size: 11px !important;
  }
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }
  .grid {
    display: block !important;
  }
  .grid > div {
    width: 100% !important;
    margin-bottom: 20px !important;
    page-break-inside: avoid;
  }
}
`;
    fs.writeFileSync('src/index.css', css);
    console.log("Updated print CSS");
}
