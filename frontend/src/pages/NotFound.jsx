import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="container page">
      <div className="empty-state">
        <h1>Page not found</h1>
        <p>The page you were looking for doesn&apos;t exist or has moved.</p>
        <Link to="/" className="btn btn-primary">
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
