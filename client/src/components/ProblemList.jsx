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
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
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
      const matchesDifficulty = selectedDifficulty === 'All' || 
        problem.Difficulty === selectedDifficulty;
      const rating = problem.Rating;
      const min = minRating === '' ? -Infinity : parseInt(minRating);
      const max = maxRating === '' ? Infinity : parseInt(maxRating);
      const matchesRating = rating >= min && rating <= max;

      return matchesSearch && matchesTags && matchesCompanies && matchesDifficulty && matchesRating;
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
  }, [problems, searchQuery, selectedTags, selectedCompanies, selectedDifficulty, sortField, sortDirection, minRating, maxRating]);

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
    setSelectedDifficulty('All');
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
        <div className="bg-white dark:bg-stone-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-stone-600 dark:text-stone-300">Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-warm-50 dark:bg-stone-950 pb-8 transition-colors duration-300">
      <Navbar />
      <div className="sticky top-0 z-20 bg-warm-50 dark:bg-stone-950 border-b border-stone-300 dark:border-stone-800 flex items-center justify-between px-6 py-4 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 transition-colors duration-300">
        <button
          onClick={onBack}
          className="flex items-center p-2 sm:px-4 sm:py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="hidden sm:inline ml-2">Back</span>
        </button>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white text-center flex-1">
          LeetCode Problems ({filteredAndSortedProblems.length})
        </h2>
        <div className="w-24" />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="p-6 border-b border-stone-300 dark:border-stone-800 space-y-4 bg-white dark:bg-stone-900 rounded-t-lg">
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-stone-800 text-stone-900 dark:text-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-start gap-6 mb-4">
            <div className="flex-1 min-w-[280px]">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Difficulty:
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {['Easy', 'Medium', 'Hard'].map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => {
                      setSelectedDifficulty(selectedDifficulty === difficulty ? 'All' : difficulty);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedDifficulty === difficulty
                        ? difficulty === 'Easy'
                          ? 'bg-green-600 text-white shadow-lg'
                          : difficulty === 'Medium'
                          ? 'bg-yellow-600 text-white shadow-lg'
                          : 'bg-red-600 text-white shadow-lg'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600'
                    }`}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Rating Range:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minRating}
                  onChange={e => { setMinRating(e.target.value); setCurrentPage(1); }}
                  className="w-20 px-2 py-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-white transition-colors"
                />
                <span className="text-stone-500 dark:text-stone-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxRating}
                  onChange={e => { setMaxRating(e.target.value); setCurrentPage(1); }}
                  className="w-20 px-2 py-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-white transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Filter by Tags:
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagFilter(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedTags.includes(tag)
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600'
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Filter by Companies:
              </label>
              <input
                type="text"
                placeholder="Search companies..."
                value={companyDropdownSearch}
                onChange={e => setCompanyDropdownSearch(e.target.value)}
                className="w-full px-2 py-1 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-white mb-2 transition-colors"
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
                  className="px-3 py-1 rounded-full text-xs font-medium bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                >
                  Clear Company Filter
                </button>
              )}
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600 transition-colors text-sm font-medium"
          >
            Clear All Filters
          </button>
        </div>
        {/* Log in to check completed problems! */}
        {!isAuthenticated && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center text-stone-600 dark:text-stone-400 bg-warm-100 dark:bg-stone-900 p-4 rounded-lg">
              Log in to check completed problems!
            </div>
          </div>
        )}
        <div className="overflow-x-auto mt-8 bg-white dark:bg-stone-900 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-stone-300 dark:divide-stone-800">
            <thead className="bg-stone-100 dark:bg-stone-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider cursor-pointer hover:text-brand-600 dark:hover:text-amber-500 transition-colors"
                  onClick={() => handleSort('ID')}
                >
                  <div className="flex items-center">
                    ID {getSortIcon('ID')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider cursor-pointer hover:text-brand-600 dark:hover:text-amber-500 transition-colors"
                  onClick={() => handleSort('Title')}
                >
                  <div className="flex items-center">
                    Title {getSortIcon('Title')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider cursor-pointer hover:text-brand-600 dark:hover:text-amber-500 transition-colors"
                  onClick={() => handleSort('Rating')}
                >
                  <div className="flex items-center">
                    Rating {getSortIcon('Rating')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider cursor-pointer hover:text-brand-600 dark:hover:text-amber-500 transition-colors"
                  onClick={() => handleSort('Difficulty')}
                >
                  <div className="flex items-center">
                    Difficulty {getSortIcon('Difficulty')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider"
                >
                  Companies
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider"
                >
                  Tags
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider cursor-pointer hover:text-brand-600 dark:hover:text-amber-500 transition-colors"
                  onClick={() => handleSort('Frequency')}
                >
                  <div className="flex items-center">
                    Frequency {getSortIcon('Frequency')}
                  </div>
                </th>
                {isAuthenticated && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider"
                  >
                    Completed
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-stone-900 divide-y divide-stone-200 dark:divide-stone-800">
              {paginatedProblems.map((problem, idx) => (
                <tr key={problem.ID + idx} className="hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                    {problem.ID}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-brand-600 dark:text-amber-500 hover:underline cursor-pointer font-medium transition-colors"
                    onClick={() => handleTitleClick(problem.Title)}
                  >
                    {formatTitle(problem.Title)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                    {problem.Rating}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      problem.Difficulty === 'Easy' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      problem.Difficulty === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                      problem.Difficulty === 'Hard' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                      'bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200'
                    }`}>
                      {problem.Difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-stone-600 dark:text-stone-400">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {problem.companies.slice(0, 3).map((company, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full">
                          {company}
                        </span>
                      ))}
                      {problem.companies.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-full">
                          +{problem.companies.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-stone-600 dark:text-stone-400">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {problem.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {problem.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-full">
                          +{problem.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                    {problem.Frequency}
                  </td>
                  {isAuthenticated && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500 border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-700 cursor-pointer"
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
            className="flex items-center px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Previous
          </button>
          <span className="text-sm text-stone-700 dark:text-stone-300 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="flex items-center px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
