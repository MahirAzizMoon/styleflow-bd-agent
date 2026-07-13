export default function ProductCard({ product, onAction }) {
  const colors = product.colors || [...new Set((product.availableVariants || []).map((item) => item.color))];
  const sizes = product.sizes || [...new Set((product.availableVariants || []).map((item) => item.size))];
  return (
    <article className="product-card">
      <div className="product-image" style={{ backgroundImage: `url(${product.imageUrl || "/boutique-hero.jpg"})` }}>
        <span>{product.category}</span>
      </div>
      <div className="product-card-body">
        <p className="product-id">{product.id}</p>
        <h4>{product.name}</h4>
        <p className="product-description">{product.description}</p>
        <strong className="product-price">৳{Number(product.price).toLocaleString()}</strong>
        {(colors.length > 0 || sizes.length > 0) && (
          <div className="variant-line">
            {colors.length > 0 && <span>{colors.slice(0, 3).join(" · ")}</span>}
            {sizes.length > 0 && <span>{sizes.slice(0, 5).join(" / ")}</span>}
          </div>
        )}
        <div className="product-actions">
          <button type="button" onClick={() => onAction(`Save ${product.id} to my wishlist.`)}>Save</button>
          <button type="button" onClick={() => onAction(`Check the available colors and sizes for ${product.id}.`)}>Check stock</button>
        </div>
      </div>
    </article>
  );
}
