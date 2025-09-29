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
    </div>
  );
};

export default Home;


