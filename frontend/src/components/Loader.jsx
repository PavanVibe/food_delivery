function Loader({ label = "Loading" }) {
  return (
    <div className="loader" role="status">
      <span className="loader-ring" aria-hidden="true" />
      {label}…
    </div>
  );
}

export default Loader;
