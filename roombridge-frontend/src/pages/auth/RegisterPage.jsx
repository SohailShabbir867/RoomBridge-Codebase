import React from 'react';

const RegisterPage = () => {
  return (
    <div className="p-8 flex justify-center items-center h-[calc(100vh-150px)]">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-primary">Register</h2>
        <form>
          <input type="text" placeholder="Full Name" className="w-full p-2 mb-4 border rounded" />
          <input type="email" placeholder="Email" className="w-full p-2 mb-4 border rounded" />
          <input type="password" placeholder="Password" className="w-full p-2 mb-4 border rounded" />
          <button className="w-full bg-primary text-white p-2 rounded">Register</button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
