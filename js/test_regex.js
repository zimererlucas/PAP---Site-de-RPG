const text = '<img src="test.png" alt="" width="300">';
const finalWidth = 400;
const safeSrc = 'test.png';
const htmlRegex = new RegExp('<img[^>]+src=["\']' + safeSrc + '["\'][^>]*>', 'g');
let newText = text.replace(htmlRegex, (match) => {
    if (match.includes('width=')) {
        return match.replace(/width=["']?\d+["']?/, `width="${finalWidth}"`);
    } else {
        return match.replace('<img ', `<img width="${finalWidth}" `);
    }
});
console.log('Result:', newText);
