import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import useFlashcardStore from '../store/flashcardStore';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import api from '../services/api';
import AnimatedDropdown from './common/AnimatedDropdown';

const handleCheckboxChange = async (problemId, isCompleted, isAuthenticated, updateProblemsCompletedInContext) => {
  if (!isAuthenticated) return;

  try {
    const response = await api.post('/users/problems-completed', {
      problemId,
      completed: isCompleted,
    });
    updateProblemsCompletedInContext(response.data.problemsCompleted);
  } catch (error) {
    console.error('Failed to update completed status', error);
  }
};

const ProblemList = ({ onBack }) => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [sortField, setSortField] = useState('ID');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [companyDropdownSearch, setCompanyDropdownSearch] = useState('');
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

  const { darkMode } = useFlashcardStore();
  const { user, isAuthenticated, updateProblemsCompletedInContext } = useAuth();

  useEffect(() => {
    const loadProblems = async () => {
      try {
        const response = await fetch(`/final_complete_leetcode_problems.csv`);
        const csvText = await response.text();

        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');

        const problemsData = lines.slice(1).map((line) => {
          const values = line.split(',');
          const companies = values[4] ? values[4].split(';').map(c => c.trim()).filter(Boolean) : [];
          const tags = values[5] ? values[5].split(';').map(tag => tag.trim()).filter(Boolean) : [];

          return {
            ID: values[0] || '',
            Title: values[1] || '',
            Rating: parseFloat(values[2]) || 0,
            Difficulty: values[3] || '',
            companies: companies,
            tags: tags,
            Frequency: values[6] || ''
          };
        });

        setProblems(problemsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading CSV data:', error);
        setLoading(false);
      }
    };

    loadProblems();
  }, []);

  useEffect(() => {
    if (companyDropdownSearch.length > 0) {
      setCompanyDropdownOpen(true);
    }
  }, [companyDropdownSearch]);

  const allTags = useMemo(() => {
    const tagSet = new Set();
    problems.forEach(problem => {
      problem.tags.forEach(tag => {
        if (tag) tagSet.add(tag);
      });
    });
    return Array.from(tagSet).sort();
  }, [problems]);

  const allCompanies = useMemo(() => {
    const companySet = new Set();
    problems.forEach(problem => {
      problem.companies.forEach(company => {
        if (company) companySet.add(company);
      });
    });
    return Array.from(companySet).sort();
  }, [problems]);

  // For AnimatedDropdown: filter companies based on search
  const filteredCompanyOptions = useMemo(() => {
    return allCompanies
      .filter(company => company.toLowerCase().includes(companyDropdownSearch.toLowerCase()))
      .map(company => ({ value: company, label: company }));
  }, [allCompanies, companyDropdownSearch]);

  // For AnimatedDropdown: selected company is single value
  const selectedCompany = selectedCompanies.length > 0 ? selectedCompanies[0] : '';
  const handleCompanyDropdownChange = (option) => {
    if (option && option.value) {
      setSelectedCompanies([option.value]);
    } else {
      setSelectedCompanies([]);
    }
    setCurrentPage(1);
  };

  const filteredAndSortedProblems = useMemo(() => {
    let filtered = problems.filter(problem => {
      const normalizedSearch = searchQuery.toLowerCase().replace(/ /g, "-");
      const matchesSearch = problem.Title.toLowerCase().includes(normalizedSearch);
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => problem.tags.includes(tag));
      const matchesCompanies = selectedCompanies.length === 0 ||
        selectedCompanies.some(company => problem.companies.includes(company));
      const rating = problem.Rating;
      const min = minRating === '' ? -Infinity : parseInt(minRating);
      const max = maxRating === '' ? Infinity : parseInt(maxRating);
      const matchesRating = rating >= min && rating <= max;

      return matchesSearch && matchesTags && matchesCompanies && matchesRating;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'Title' || sortField === 'Difficulty') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (sortField === 'ID') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else if (sortField === 'Frequency') {
        aValue = parseFloat(aValue.replace('%', '')) || 0;
        bValue = parseFloat(bValue.replace('%', '')) || 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [problems, searchQuery, selectedTags, selectedCompanies, sortField, sortDirection, minRating, maxRating]);

  const totalPages = Math.ceil(filteredAndSortedProblems.length / itemsPerPage);
  const paginatedProblems = filteredAndSortedProblems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    } 
    setCurrentPage(1);
  };

  const handleTagFilter = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    setCurrentPage(1);
  };

  const handleCompanyFilter = (company) => {
    if (selectedCompanies.includes(company)) {
      setSelectedCompanies(selectedCompanies.filter(c => c !== company));
    } else {
      setSelectedCompanies([...selectedCompanies, company]);
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedCompanies([]);
    setMinRating('');
    setMaxRating('');
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const formatTitle = (title) => {
    return title.replace(/-/g, ' ');
  };

  const handleTitleClick = (title) => {
    window.open(`https://leetcode.com/problems/${title}`, '_blank');
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <ChevronUpIcon className="h-4 w-4" /> :
      <ChevronDownIcon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 pb-8">
      <Navbar />
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center p-2 sm:px-4 sm:py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="hidden sm:inline ml-2">Back</span>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center flex-1">
          LeetCode Problems ({filteredAndSortedProblems.length})
        </h2>
        <div className="w-24" />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rating Range:
            </label>
            <input
              type="number"
              placeholder="Min"
              value={minRating}
              onChange={e => { setMinRating(e.target.value); setCurrentPage(1); }}
              className="w-16 sm:w-20 md:w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <span className="text-gray-500 dark:text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxRating}
              onChange={e => { setMaxRating(e.target.value); setCurrentPage(1); }}
              className="w-16 sm:w-20 md:w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Tags:
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagFilter(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedTags.includes(tag)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Companies:
              </label>
              <input
                type="text"
                placeholder="Search companies..."
                value={companyDropdownSearch}
                onChange={e => setCompanyDropdownSearch(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
              />
              <AnimatedDropdown
                options={filteredCompanyOptions}
                value={selectedCompany}
                onChange={handleCompanyDropdownChange}
                placeholder="Select company"
                className="mb-2"
                isOpen={companyDropdownOpen || undefined}
                setIsOpen={setCompanyDropdownOpen}
              />
              {selectedCompany && (
                <button
                  onClick={() => setSelectedCompanies([])}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Clear Company Filter
                </button>
              )}
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors text-sm font-medium"
          >
            Clear All Filters
          </button>
        </div>
        {/* Log in to check completed problems! */}
        {!isAuthenticated && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center text-gray-600 dark:text-gray-300">
              Log in to check completed problems!
            </div>
          </div>
        )}
        <div className="overflow-x-auto mt-8">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('ID')}
                >
                  <div className="flex items-center">
                    ID {getSortIcon('ID')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('Title')}
                >
                  <div className="flex items-center">
                    Title {getSortIcon('Title')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('Rating')}
                >
                  <div className="flex items-center">
                    Rating {getSortIcon('Rating')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('Difficulty')}
                >
                  <div className="flex items-center">
                    Difficulty {getSortIcon('Difficulty')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Companies
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Tags
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('Frequency')}
                >
                  <div className="flex items-center">
                    Frequency {getSortIcon('Frequency')}
                  </div>
                </th>
                {isAuthenticated && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Completed
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedProblems.map((problem, idx) => (
                <tr key={problem.ID + idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {problem.ID}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    onClick={() => handleTitleClick(problem.Title)}
                  >
                    {formatTitle(problem.Title)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {problem.Rating}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      problem.Difficulty === 'Easy' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      problem.Difficulty === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                      problem.Difficulty === 'Hard' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {problem.Difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {problem.companies.slice(0, 3).map((company, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                          {company}
                        </span>
                      ))}
                      {problem.companies.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                          +{problem.companies.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {problem.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {problem.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                          +{problem.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {problem.Frequency}
                  </td>
                  {isAuthenticated && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
                        checked={user?.problemsCompleted?.includes(problem.Title)}
                        onChange={(e) => handleCheckboxChange(problem.Title, e.target.checked, isAuthenticated, updateProblemsCompletedInContext)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRightIcon className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProblemList;
