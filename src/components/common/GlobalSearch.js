import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Box, 
  TextField, 
  InputAdornment, 
  IconButton,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Divider,
  Chip,
  Fade
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import BusinessIcon from '@mui/icons-material/Business';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';
import { globalSearch } from '../../api/database-api';

// Define styled components
const SearchWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.15)' 
    : 'rgba(0, 0, 0, 0.04)',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.25)' 
      : 'rgba(0, 0, 0, 0.08)',
  },
  transition: theme.transitions.create('width'),
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: '300px',
  },
}));

const SearchResults = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: theme.spacing(1),
  maxHeight: '400px',
  overflowY: 'auto',
  zIndex: 1300,
  boxShadow: theme.shadows[8],
}));

const GlobalSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // دالة البحث مع debounce
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await globalSearch(query, 15);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('خطأ في البحث:', error);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce البحث
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults(null);
    setShowResults(false);
  };

  const handleResultClick = (item) => {
    console.log('التنقل إلى:', item.url, 'البيانات:', item);
    try {
      navigate(item.url);
      setShowResults(false);
      setSearchQuery('');
    } catch (error) {
      console.error('خطأ في التنقل:', error);
      // محاولة بديلة باستخدام window.location
      window.location.href = item.url;
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && searchResults?.total > 0) {
      // انتقل إلى أول نتيجة
      const firstResult = searchResults.companies[0] || 
                         searchResults.branches[0] || 
                         searchResults.projects[0] || 
                         searchResults.employees[0];
      if (firstResult) {
        handleResultClick(firstResult);
      }
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'company': return <BusinessIcon />;
      case 'branch': return <AccountTreeIcon />;
      case 'project': return <WorkIcon />;
      case 'employee': return <PersonIcon />;
      default: return <SearchIcon />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'company': return 'شركة';
      case 'branch': return 'فرع';
      case 'project': return 'مشروع';
      case 'employee': return 'موظف';
      default: return '';
    }
  };

  // إخفاء النتائج عند النقر خارج المكون
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const renderSearchResults = () => {
    if (!searchResults || searchResults.total === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {searchQuery ? `لا توجد نتائج للبحث عن "${searchQuery}"` : 'ابدأ بكتابة للبحث...'}
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        {/* عرض العدد الإجمالي للنتائج */}
        <Box sx={{ p: 1.5, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="subtitle2" sx={{ textAlign: 'center' }}>
            تم العثور على {searchResults.total} نتيجة للبحث عن "{searchQuery}"
          </Typography>
        </Box>
        
        <List sx={{ py: 0 }}>
          {/* الشركات */}
        {searchResults.companies.length > 0 && (
          <>
            <ListItem sx={{ bgcolor: 'action.hover', py: 0.5 }}>
              <Typography variant="subtitle2" color="primary">
                الشركات ({searchResults.companies.length})
              </Typography>
            </ListItem>
            {searchResults.companies.map((company) => (
              <ListItem 
                key={`company-${company.id}`}
                button
                onClick={() => handleResultClick(company)}
                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getIcon(company.type)}
                </ListItemIcon>
                <ListItemText
                  primary={company.name}
                  secondary={`شركة في ${company.city}, ${company.country}`}
                />
                <Chip label={getTypeLabel(company.type)} size="small" />
              </ListItem>
            ))}
            {(searchResults.branches.length > 0 || searchResults.projects.length > 0 || searchResults.employees.length > 0) && <Divider />}
          </>
        )}

        {/* الفروع */}
        {searchResults.branches.length > 0 && (
          <>
            <ListItem sx={{ bgcolor: 'action.hover', py: 0.5 }}>
              <Typography variant="subtitle2" color="primary">
                الفروع ({searchResults.branches.length})
              </Typography>
            </ListItem>
            {searchResults.branches.map((branch) => (
              <ListItem 
                key={`branch-${branch.id}`}
                button
                onClick={() => handleResultClick(branch)}
                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getIcon(branch.type)}
                </ListItemIcon>
                <ListItemText
                  primary={branch.name}
                  secondary={`فرع تابع لـ ${branch.companyName} في ${branch.address}`}
                />
                <Chip label={getTypeLabel(branch.type)} size="small" />
              </ListItem>
            ))}
            {(searchResults.projects.length > 0 || searchResults.employees.length > 0) && <Divider />}
          </>
        )}

        {/* المشاريع */}
        {searchResults.projects.length > 0 && (
          <>
            <ListItem sx={{ bgcolor: 'action.hover', py: 0.5 }}>
              <Typography variant="subtitle2" color="primary">
                المشاريع ({searchResults.projects.length})
              </Typography>
            </ListItem>
            {searchResults.projects.map((project) => (
              <ListItem 
                key={`project-${project.id}`}
                button
                onClick={() => handleResultClick(project)}
                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getIcon(project.type)}
                </ListItemIcon>
                <ListItemText
                  primary={project.name}
                  secondary={`مشروع ${project.contractType} في ${project.location} - ${project.companyName}`}
                />
                <Chip label={getTypeLabel(project.type)} size="small" />
              </ListItem>
            ))}
            {searchResults.employees.length > 0 && <Divider />}
          </>
        )}

        {/* الموظفين */}
        {searchResults.employees.length > 0 && (
          <>
            <ListItem sx={{ bgcolor: 'action.hover', py: 0.5 }}>
              <Typography variant="subtitle2" color="primary">
                الموظفين ({searchResults.employees.length})
              </Typography>
            </ListItem>
            {searchResults.employees.map((employee) => (
              <ListItem 
                key={`employee-${employee.id}`}
                button
                onClick={() => handleResultClick(employee)}
                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getIcon(employee.type)}
                </ListItemIcon>
                <ListItemText
                  primary={employee.name}
                  secondary={`${employee.position} في قسم ${employee.department} - ${employee.companyName}`}
                />
                <Chip label={getTypeLabel(employee.type)} size="small" />
              </ListItem>
            ))}
          </>
        )}
              </List>
      </Box>
      );
    };

  return (
    <Box sx={{ position: 'relative' }} ref={searchInputRef}>
      <SearchWrapper>
        <TextField
          fullWidth
          placeholder="بحث في النظام..."
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <IconButton size="small" disabled>
                  {isLoading ? (
                    <CircularProgress size={18} />
                  ) : (
                    <SearchIcon />
                  )}
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClear}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              height: 42,
              px: 1,
              py: 0.5,
              borderRadius: 1,
            }
          }}
          autoComplete="off"
        />
      </SearchWrapper>
      
      <Fade in={showResults && (searchQuery.length > 0)}>
        <SearchResults>
          {renderSearchResults()}
        </SearchResults>
      </Fade>
    </Box>
  );
};

export default GlobalSearch; 