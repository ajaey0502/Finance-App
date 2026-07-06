import { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionModal } from '../components/transactions/TransactionModal';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import api from '../services/api';

const PAGE_SIZE = 20;

export function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState();

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // The category filter dropdown should list every category the user has
  // ever used, not just the ones on the currently loaded page.
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.get('/categories');
        setCategories((response.data?.data || []).map((c) => c.name));
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    }
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    try {
      setError('');
      setIsLoading(true);

      const [year, month] = selectedMonth ? selectedMonth.split('-') : [];
      const params = { page, limit: PAGE_SIZE };
      if (year && month) {
        params.year = year;
        params.month = month;
      }
      if (selectedCategory) params.category = selectedCategory;
      if (selectedType !== 'all') params.type = selectedType;

      const response = await api.get('/transactions', { params });
      setTransactions(response.data.data || []);
      setPagination(response.data.meta || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedCategory, selectedType, page]);

  // Any filter change should reset back to the first page.
  const handleMonthChange = (value) => {
    setSelectedMonth(value);
    setPage(1);
  };
  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setPage(1);
  };
  const handleTypeChange = (value) => {
    setSelectedType(value);
    setPage(1);
  };

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchTransactions();
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        setError('Failed to delete transaction');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTransaction(undefined);
  };

  const handleSaveTransaction = () => {
    fetchTransactions();
    handleCloseModal();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
              <p className="text-gray-600">Manage your financial transactions</p>
            </div>

            <TransactionFilters
              selectedMonth={selectedMonth}
              selectedCategory={selectedCategory}
              selectedType={selectedType}
              onMonthChange={handleMonthChange}
              onCategoryChange={handleCategoryChange}
              onTypeChange={handleTypeChange}
              onAddTransaction={() => setShowModal(true)}
              categories={categories}
            />

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Loading transactions...</div>
              </div>
            ) : (
              <>
                <TransactionList
                  transactions={transactions}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />

                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4 px-2">
                    <p className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={pagination.page <= 1}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                        disabled={pagination.page >= pagination.pages}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {showModal && (
              <TransactionModal
                transaction={selectedTransaction}
                onClose={handleCloseModal}
                onSave={handleSaveTransaction}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
