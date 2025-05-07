import React from "react";

const AdminCategoriesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Categories Management</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600 mb-4">Manage product categories and subcategories here.</p>
        {/* Category management UI will go here */}
      </div>
    </div>
  );
};

export default AdminCategoriesPage;