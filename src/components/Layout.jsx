import { Header } from './Header';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      
      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-auto">
        <div className="container mx-auto px-6 text-center text-sm text-gray-600">
          <p>Carge - Built on Ragchain (Tanssi Parachain)</p>
          <p className="mt-2 text-xs">Open Source · GPL-3.0 License</p>
        </div>
      </footer>
    </div>
  );
};

