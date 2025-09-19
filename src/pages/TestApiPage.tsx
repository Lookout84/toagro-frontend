import { useState, useEffect } from "react";
import { listingsAPI } from "../api/apiClient";

const TestApiPage = () => {
  const [listings, setListings] = useState([]);
  const [singleListing, setSingleListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const testGetAllListings = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("🔍 Testing GET /api/listings");
      const response = await listingsAPI.getAll();
      console.log("📦 Response:", response);
      
      if (response.data && response.data.data && response.data.data.listings) {
        setListings(response.data.data.listings);
        console.log("✅ Found listings:", response.data.data.listings.length);
      } else {
        console.log("❌ Unexpected structure:", response);
        setError("Неочікувана структура відповіді");
      }
    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };

  const testGetSingleListing = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      console.log(`🔍 Testing GET /api/listings/${id}`);
      const response = await listingsAPI.getById(id);
      console.log("📦 Response:", response);
      
      if (response.data && response.data.data && response.data.data.listing) {
        setSingleListing(response.data.data.listing);
        console.log("✅ Found listing:", response.data.data.listing);
      } else {
        console.log("❌ Unexpected structure:", response);
        setError("Неочікувана структура відповіді");
      }
    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testGetAllListings();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">API Testing Page</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
          Завантаження...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Всі оголошення</h2>
          <button
            onClick={testGetAllListings}
            className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
          >
            Завантажити всі оголошення
          </button>
          
          {listings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Знайдено: {listings.length} оголошень</p>
              {listings.slice(0, 5).map((listing: any) => (
                <div key={listing.id} className="border p-3 rounded">
                  <h3 className="font-medium">{listing.title}</h3>
                  <p className="text-sm text-gray-600">ID: {listing.id}</p>
                  <button
                    onClick={() => testGetSingleListing(listing.id)}
                    className="text-green-600 hover:underline text-sm mt-2"
                  >
                    Завантажити деталі
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Одне оголошення</h2>
          
          <div className="space-x-2 mb-4">
            <button
              onClick={() => testGetSingleListing(10)}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Тест ID: 10
            </button>
            <button
              onClick={() => testGetSingleListing(1)}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Тест ID: 1
            </button>
          </div>
          
          {singleListing && (
            <div className="border p-4 rounded">
              <h3 className="font-medium">{(singleListing as any).title}</h3>
              <p className="text-sm text-gray-600 mt-2">
                ID: {(singleListing as any).id}
              </p>
              <p className="text-sm text-gray-600">
                Ціна: {(singleListing as any).price}
              </p>
              <p className="text-sm text-gray-600">
                Категорія: {(singleListing as any).category}
              </p>
              <p className="text-sm text-gray-600">
                Користувач: {(singleListing as any).user?.name}
              </p>
              
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-blue-600">
                  Показати повний об'єкт
                </summary>
                <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto">
                  {JSON.stringify(singleListing, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestApiPage;