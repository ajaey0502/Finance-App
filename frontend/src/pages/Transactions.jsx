import { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionModal } from '../components/transactions/TransactionModal';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import api from '../services/api';

export function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState();
  
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const fetchTransactions = async () => {
    try {
      setError('');
      setIsLoading(true);
      const response = await api.get('/transactions');
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    let filtered = transactions;

    if (selectedMonth) {
      filtered = filtered.filter((t) =>
        new Date(t.date).toISOString().slice(0, 7) === selectedMonth
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter((t) => t.type === selectedType);
    }

    setFilteredTransactions(filtered);
  }, [transactions, selectedMonth, selectedCategory, selectedType]);

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/transactions/${id}`);
        setTransactions(transactions.filter((t) => t._id !== id));
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
              onMonthChange={setSelectedMonth}
              onCategoryChange={setSelectedCategory}
              onTypeChange={setSelectedType}
              onAddTransaction={() => setShowModal(true)}
              categories={[...new Set(transactions.map((t) => t.category))]}
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
              <TransactionList
                transactions={filteredTransactions}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
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




