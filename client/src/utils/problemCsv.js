// Read quoted CSV fields, including escaped quotes and embedded newlines.
export function parseProblemCsv(text) {
  const records = [];
  let row = [];
  let value = '';
  let quoted = false;
  let closedQuote = false;
  const finishField = () => {
    row.push(value);
    value = '';
    closedQuote = false;
  };
  const finishRow = () => {
    finishField();
    if (row.some(field => field !== '')) records.push(row);
    row = [];
  };
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          value += '"';
          i += 1;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        value += char;
      }
    } else if (char === ',') {
      finishField();
    } else if (char === '\r' || char === '\n') {
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      finishRow();
    } else if (char === '"' && value === '' && !closedQuote) {
      quoted = true;
    } else {
      if (closedQuote || char === '"') throw new Error('Invalid quoted CSV field');
      value += char;
    }
  }
  if (quoted) throw new Error('Unclosed quoted CSV field');
  if (value || row.length || closedQuote) finishRow();
  const fields = ['ID', 'Title', 'Rating', 'Difficulty', 'Companies', 'Tags'];
  const headers = records.shift();
  if (!headers || fields.some((field, i) => headers[i] !== field)) {
    throw new Error('Unexpected problem CSV header');
  }
  return records.map(values => {
    if (values.length !== headers.length) throw new Error('Invalid problem CSV row');
    return {
      ID: values[0],
      Title: values[1],
      Rating: parseFloat(values[2]) || 0,
      Difficulty: values[3],
      companies: values[4].split(';').map(company => company.trim()).filter(Boolean),
      tags: values[5].split(';').map(tag => tag.trim()).filter(Boolean),
    };
  });
}
