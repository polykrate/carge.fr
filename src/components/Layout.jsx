import { Header } from './Header';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      <main>{children}</main>
    </div>
  );
};

