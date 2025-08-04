import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  Assignment,
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from '@mui/icons-material';
import {
  useProjectExpenses,
  useProjectRevenue,
  useProjectReturns,
  useProjectRequests,
  PaginationParams,
} from '../api/database-api';
import { formatGregorianDate } from '../utils/dateUtils';

interface ProjectDetailsPaginationProps {
  projectId: string;
}

const ProjectDetailsPagination: React.FC<ProjectDetailsPaginationProps> = ({ projectId }) => {
  // Pagination states
  const [expensesPagination, setExpensesPagination] = useState<PaginationParams>({ limit: 10, lastId: 0 });
  const [revenuePagination, setRevenuePagination] = useState<PaginationParams>({ limit: 10, lastId: 0 });
  const [returnsPagination, setReturnsPagination] = useState<PaginationParams>({ limit: 10, lastId: 0 });
  const [requestsPagination, setRequestsPagination] = useState<PaginationParams>({ limit: 10, lastId: 0 });
  
  // Page numbers for UI
  const [expensesPage, setExpensesPage] = useState(1);
  const [revenuePage, setRevenuePage] = useState(1);
  const [returnsPage, setReturnsPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);

  // Data fetching
  const { data: expensesData, isLoading: expensesLoading } = useProjectExpenses(projectId, expensesPagination);
  const { data: revenueData, isLoading: revenueLoading } = useProjectRevenue(projectId, revenuePagination);
  const { data: returnsData, isLoading: returnsLoading } = useProjectReturns(projectId, returnsPagination);
  const { data: requestsData, isLoading: requestsLoading } = useProjectRequests(projectId, "", "", requestsPagination);

  // Extract data with hasMore
  const expenses = expensesData?.expenses || [];
  const expensesHasMore = expensesData?.hasMore || false;
  
  const revenue = revenueData?.revenue || [];
  const revenueHasMore = revenueData?.hasMore || false;
  
  const returns = returnsData?.returns || [];
  const returnsHasMore = returnsData?.hasMore || false;
  
  const requests = requestsData?.requests || [];
  const requestsHasMore = requestsData?.hasMore || false;

  // Pagination handlers
  const handleExpensesNextPage = () => {
    if (expensesHasMore && expenses.length > 0) {
      // استخدام أصغر ID من الصفحة الحالية لتجنب التكرار
      const expenseIds = expenses.map(e => Number(e.id)).filter(id => !isNaN(id));
      const smallestId = Math.min(...expenseIds);
      setExpensesPagination(prev => ({ 
        ...prev, 
        lastId: smallestId
      }));
      setExpensesPage(prev => prev + 1);
    }
  };

  const handleExpensesPrevPage = () => {
    if (expensesPage > 1) {
      setExpensesPagination({ limit: 10, lastId: 0 });
      setExpensesPage(1);
    }
  };

  const handleRevenueNextPage = () => {
    if (revenueHasMore && revenue.length > 0) {
      // استخدام أصغر ID من الصفحة الحالية لتجنب التكرار
      const revenueIds = revenue.map(r => Number(r.id)).filter(id => !isNaN(id));
      const smallestId = Math.min(...revenueIds);
      setRevenuePagination(prev => ({ 
        ...prev, 
        lastId: smallestId
      }));
      setRevenuePage(prev => prev + 1);
    }
  };

  const handleRevenuePrevPage = () => {
    if (revenuePage > 1) {
      setRevenuePagination({ limit: 10, lastId: 0 });
      setRevenuePage(1);
    }
  };

  const handleReturnsNextPage = () => {
    if (returnsHasMore && returns.length > 0) {
      // استخدام أصغر ID من الصفحة الحالية لتجنب التكرار
      const returnIds = returns.map(r => Number(r.id)).filter(id => !isNaN(id));
      const smallestId = Math.min(...returnIds);
      setReturnsPagination(prev => ({ 
        ...prev, 
        lastId: smallestId
      }));
      setReturnsPage(prev => prev + 1);
    }
  };

  const handleReturnsPrevPage = () => {
    if (returnsPage > 1) {
      setReturnsPagination({ limit: 10, lastId: 0 });
      setReturnsPage(1);
    }
  };

  const handleRequestsNextPage = () => {
    if (requestsHasMore && requests.length > 0) {
      // استخدام أصغر ID من الصفحة الحالية لتجنب التكرار
      const requestIds = requests.map(r => Number(r.id)).filter(id => !isNaN(id));
      const smallestId = Math.min(...requestIds);
      setRequestsPagination(prev => ({ 
        ...prev, 
        lastId: smallestId
      }));
      setRequestsPage(prev => prev + 1);
    }
  };

  const handleRequestsPrevPage = () => {
    if (requestsPage > 1) {
      setRequestsPagination({ limit: 10, lastId: 0 });
      setRequestsPage(1);
    }
  };

  // Render pagination controls
  const renderPaginationControls = (
    hasMore: boolean,
    onNext: () => void,
    onPrev: () => void,
    currentPage: number,
    currentLength: number,
    isLoading: boolean
  ) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
      <Typography variant="body2" color="text.secondary">
        عرض {currentLength} عنصر (الصفحة {currentPage})
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button 
          size="small" 
          onClick={onPrev}
          disabled={currentPage <= 1 || isLoading}
          variant="outlined"
          startIcon={<KeyboardArrowRight />}
        >
          السابق
        </Button>
        <Typography variant="body2" sx={{ alignSelf: 'center', mx: 1 }}>
          صفحة {currentPage}
        </Typography>
        <Button 
          size="small" 
          onClick={onNext}
          disabled={!hasMore || isLoading}
          variant="outlined"
          endIcon={<KeyboardArrowLeft />}
        >
          التالي ({currentLength}/10)
        </Button>
      </Box>
    </Box>
  );

  return (
    <Grid container spacing={3}>
      {/* المصروفات */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AttachMoney color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">المصروفات</Typography>
            </Box>
            
            {expensesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={30} />
              </Box>
            ) : expenses.length > 0 ? (
              <>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>البيان</TableCell>
                        <TableCell>المبلغ</TableCell>
                        <TableCell>التاريخ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenses.map((expense: any, index: number) => (
                        <TableRow key={expense.id || index}>
                          <TableCell>{expense.description || 'غير محدد'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${expense.amount || 0} ريال`}
                              color="error"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {expense.date ? formatGregorianDate(expense.date) : 'غير محدد'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {renderPaginationControls(
                  expensesHasMore,
                  handleExpensesNextPage,
                  handleExpensesPrevPage,
                  expensesPage,
                  expenses.length,
                  expensesLoading
                )}
              </>
            ) : (
              <Alert severity="info">لا توجد مصروفات لهذا المشروع</Alert>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* الإيرادات */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">الإيرادات</Typography>
            </Box>
            
            {revenueLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={30} />
              </Box>
            ) : revenue.length > 0 ? (
              <>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>البيان</TableCell>
                        <TableCell>المبلغ</TableCell>
                        <TableCell>التاريخ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {revenue.map((rev: any, index: number) => (
                        <TableRow key={rev.id || index}>
                          <TableCell>{rev.description || 'غير محدد'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${rev.amount || 0} ريال`}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {rev.date ? formatGregorianDate(rev.date) : 'غير محدد'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {renderPaginationControls(
                  revenueHasMore,
                  handleRevenueNextPage,
                  handleRevenuePrevPage,
                  revenuePage,
                  revenue.length,
                  revenueLoading
                )}
              </>
            ) : (
              <Alert severity="info">لا توجد إيرادات لهذا المشروع</Alert>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* الإرجاعات */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Assignment color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">الإرجاعات</Typography>
            </Box>
            
            {returnsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={30} />
              </Box>
            ) : returns.length > 0 ? (
              <>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>البيان</TableCell>
                        <TableCell>المبلغ</TableCell>
                        <TableCell>التاريخ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {returns.map((ret: any, index: number) => (
                        <TableRow key={ret.id || index}>
                          <TableCell>{ret.description || 'غير محدد'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${ret.amount || 0} ريال`}
                              color="warning"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {ret.date ? formatGregorianDate(ret.date) : 'غير محدد'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {renderPaginationControls(
                  returnsHasMore,
                  handleReturnsNextPage,
                  handleReturnsPrevPage,
                  returnsPage,
                  returns.length,
                  returnsLoading
                )}
              </>
            ) : (
              <Alert severity="info">لا توجد إرجاعات لهذا المشروع</Alert>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* الطلبات */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Assignment color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">الطلبات</Typography>
            </Box>
            
            {requestsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={30} />
              </Box>
            ) : requests.length > 0 ? (
              <>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>البيان</TableCell>
                        <TableCell>الحالة</TableCell>
                        <TableCell>التاريخ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {requests.map((request: any, index: number) => (
                        <TableRow key={request.id || index}>
                          <TableCell>{request.description || request.title || 'غير محدد'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={request.status === '1' ? 'مكتمل' : 'في الانتظار'}
                              color={request.status === '1' ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {request.date ? formatGregorianDate(request.date) : 'غير محدد'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {renderPaginationControls(
                  requestsHasMore,
                  handleRequestsNextPage,
                  handleRequestsPrevPage,
                  requestsPage,
                  requests.length,
                  requestsLoading
                )}
              </>
            ) : (
              <Alert severity="info">لا توجد طلبات لهذا المشروع</Alert>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ProjectDetailsPagination; 