const text = '<img src="https://my-supabase.co/storage/v1/object/public/avatars/forum/123_123_img.png" alt="" width="300">';
const finalWidth = 500;
const src = 'https://my-supabase.co/storage/v1/object/public/avatars/forum/123_123_img.png';
const safeSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const htmlRegex = new RegExp(`<img[^>]+src=["']${safeSrc}["'][^>]*>`, 'g');
let newText = text.replace(htmlRegex, (match) => {
    if (match.includes('width=')) {
        return match.replace(/width=["']?\d+["']?/, `width="${finalWidth}"`);
    } else {
        return match.replace('<img ', `<img width="${finalWidth}" `);
    }
});
console.log('Original:', text);
console.log('Modified:', newText);
