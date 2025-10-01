import { Link } from "react-router-dom";

type HomeProps = {
  title: string;
};

const Home = ({ title }: HomeProps) => {
  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold text-blue-600">{title}</h1>
      <p className="mt-4 text-gray-700">
        <span className="font-semibold text-red-600">Home Page</span>
      </p>

      {/* Nút sang Login */}
      <Link to="/login">
        <button className="mt-6 px-4 py-2 bg-blue-500 text-white rounded">
          Go to Login
        </button>
      </Link>
    </div>
  );
};

export default Home;
