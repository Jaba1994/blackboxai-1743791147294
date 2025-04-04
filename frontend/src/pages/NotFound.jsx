import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-white px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="max-w-max mx-auto">
        <main className="sm:flex">
          <p className="text-4xl font-extrabold text-primary-600 sm:text-5xl">404</p>
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-gray-200 sm:pl-6">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                Page not found
              </h1>
              <p className="mt-1 text-base text-gray-500">
                Please check the URL in the address bar and try again.
              </p>
            </div>
            <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Go back home
              </Link>
              <Link
                to="/support"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Contact support
              </Link>
            </div>
          </div>
        </main>

        {/* Additional helpful links */}
        <div className="mt-16">
          <h2 className="text-sm font-semibold text-gray-500 tracking-wide uppercase">
            Popular pages
          </h2>
          <ul className="mt-4 border-t border-gray-200 divide-y divide-gray-200">
            <li className="py-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-3 text-base text-gray-900 hover:text-primary-600"
              >
                <span className="font-medium">Dashboard</span>
                <span className="text-gray-400">&rarr;</span>
              </Link>
            </li>
            <li className="py-4">
              <Link
                to="/content"
                className="flex items-center space-x-3 text-base text-gray-900 hover:text-primary-600"
              >
                <span className="font-medium">Content Manager</span>
                <span className="text-gray-400">&rarr;</span>
              </Link>
            </li>
            <li className="py-4">
              <Link
                to="/analytics"
                className="flex items-center space-x-3 text-base text-gray-900 hover:text-primary-600"
              >
                <span className="font-medium">Analytics</span>
                <span className="text-gray-400">&rarr;</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Search suggestion */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500">
            Looking for something specific?{' '}
            <Link
              to="/search"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Search our site
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;