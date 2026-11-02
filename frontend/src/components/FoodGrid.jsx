import FoodCard from "./FoodCard";
import "./foodgrid.css";

function FoodGrid({ foods, title, subtitle, reasons = {}, emptyMessage = "No dishes match these filters." }) {
  return (
    <section className="food-section">
      {title && (
        <div className="section-title">
          <h2>{title}</h2>
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}

      {foods.length === 0 ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        <div className="food-grid">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} reason={reasons[food.id]} />
          ))}
        </div>
      )}
    </section>
  );
}

export default FoodGrid;
