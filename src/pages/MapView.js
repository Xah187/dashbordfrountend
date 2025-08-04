import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Divider,
  useTheme
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LayersIcon from '@mui/icons-material/Layers';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

// تم إزالة الـ contexts الوهمية

// نموذج لمكون الخريطة - في التطبيق الحقيقي ستحتاج لمكتبة خرائط مثل Leaflet أو Google Maps
const MapComponent = ({ markers, onMarkerClick, mapType, selectedItem }) => {
  const theme = useTheme();
  
  // نموذج لمكون خريطة بسيط
  return (
    <Box 
      sx={{ 
        height: 600, 
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        borderRadius: 1,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* هنا صورة الخريطة */}
      <Box 
        component="img" 
        src="/assets/images/map-placeholder.png" 
        alt="خريطة" 
        sx={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          opacity: 0.7
        }} 
      />
      
      {/* نقاط المواقع */}
      {markers.map((marker) => (
        <Box
          key={`${marker.type}-${marker.id}`}
          sx={{
            position: 'absolute',
            left: `${marker.coordinates.x}%`,
            top: `${marker.coordinates.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            cursor: 'pointer',
            animation: selectedItem && selectedItem.id === marker.id && selectedItem.type === marker.type 
              ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': {
                transform: 'translate(-50%, -50%) scale(1)',
              },
              '50%': {
                transform: 'translate(-50%, -50%) scale(1.2)',
              },
              '100%': {
                transform: 'translate(-50%, -50%) scale(1)',
              },
            },
          }}
          onClick={() => onMarkerClick(marker)}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              width: 40,
              height: 40,
              bgcolor: marker.type === 'branch' 
                ? theme.palette.primary.main 
                : theme.palette.secondary.main,
              color: '#fff',
              boxShadow: 3,
            }}
          >
            {marker.type === 'branch' ? <BusinessIcon /> : <AccountTreeIcon />}
          </Box>
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: '#fff',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              mt: 0.5,
              fontWeight: 'bold'
            }}
          >
            {marker.name}
          </Typography>
        </Box>
      ))}
      
      {/* أدوات التحكم في الخريطة */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 2,
            cursor: 'pointer',
          }}
        >
          <ZoomInIcon />
        </Box>
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 2,
            cursor: 'pointer',
          }}
        >
          <LayersIcon />
        </Box>
      </Box>
    </Box>
  );
};

// مكون بطاقة تفاصيل الموقع
const LocationDetailsCard = ({ item, type }) => {
  if (!item) return null;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {type === 'branch' ? (
            <BusinessIcon color="primary" sx={{ mr: 1 }} />
          ) : (
            <AccountTreeIcon color="secondary" sx={{ mr: 1 }} />
          )}
          <Typography variant="h6">{item.name}</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {type === 'branch' && (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>المدير:</strong> {item.manager}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>العنوان:</strong> {item.address}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>الهاتف:</strong> {item.phone}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>البريد الإلكتروني:</strong> {item.email}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>عدد المشاريع:</strong> {item.projects?.length || 0}
            </Typography>
            <Typography variant="body2">
              <strong>عدد الموظفين:</strong> {item.employeesCount}
            </Typography>
          </>
        )}
        {type === 'project' && (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>نسبة الإنجاز:</strong> {item.progress}%
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>إجمالي المهام:</strong> {item.totalTasks}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>المهام المكتملة:</strong> {item.completedTasks}
            </Typography>
            <Typography variant="body2">
              <strong>الفرع:</strong> {item.branchName}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const MapView = () => {
  // بيانات تجريبية مؤقتة
  const projects = [];
  const branches = [];
  const companies = [];
  
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [viewType, setViewType] = useState('all');
  const [markers, setMarkers] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [filteredLocations, setFilteredLocations] = useState([]);
  
  // تحويل البيانات إلى نقاط على الخريطة
  useEffect(() => {
    const generateMapMarkers = () => {
      const branchMarkers = branches
        .filter(branch => 
          selectedCompanies.length === 0 || 
          selectedCompanies.includes(branch.companyId)
        )
        .filter(branch => viewType === 'all' || viewType === 'branches')
        .map(branch => ({
          id: branch.id,
          name: branch.name,
          type: 'branch',
          companyId: branch.companyId,
          companyName: companies.find(c => c.id === branch.companyId)?.name || '',
          data: branch,
          // توليد إحداثيات عشوائية للتجربة فقط - في التطبيق الحقيقي ستستخدم إحداثيات حقيقية
          coordinates: {
            x: 20 + Math.random() * 60,
            y: 20 + Math.random() * 60
          }
        }));
      
      const projectMarkers = projects
        .filter(project => 
          selectedCompanies.length === 0 || 
          selectedCompanies.includes(project.companyId)
        )
        .filter(project => viewType === 'all' || viewType === 'projects')
        .map(project => {
          const branch = branches.find(b => b.id === project.branchId);
          return {
            id: project.id,
            name: project.name,
            type: 'project',
            companyId: project.companyId,
            branchId: project.branchId,
            branchName: branch?.name || '',
            companyName: companies.find(c => c.id === project.companyId)?.name || '',
            data: { ...project, branchName: branch?.name || '' },
            // توليد إحداثيات عشوائية للتجربة فقط
            coordinates: {
              x: 20 + Math.random() * 60,
              y: 20 + Math.random() * 60
            }
          };
        });
      
      const allMarkers = [...branchMarkers, ...projectMarkers];
      setMarkers(allMarkers);
      
      // تحديث قائمة المواقع المصفاة
      const filteredBranches = viewType === 'projects' ? [] : branchMarkers;
      const filteredProjects = viewType === 'branches' ? [] : projectMarkers;
      setFilteredLocations([...filteredBranches, ...filteredProjects]);
    };
    
    generateMapMarkers();
  }, [branches, projects, companies, selectedCompanies, viewType]);
  
  const handleMarkerClick = (marker) => {
    setSelectedItem(marker.data);
    setSelectedType(marker.type);
  };
  
  const handleCompanyChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedCompanies(
      typeof value === 'string' ? value.split(',') : value.map(v => parseInt(v))
    );
  };
  
  const handleViewTypeChange = (event, newViewType) => {
    if (newViewType !== null) {
      setViewType(newViewType);
    }
  };
  
  const handleLocationItemClick = (location) => {
    setSelectedItem(location.data);
    setSelectedType(location.type);
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 3 }}>
        <Typography variant="h4" gutterBottom>
          نظام الخرائط التفاعلي
        </Typography>
        <Typography variant="body2">
          عرض ومتابعة مواقع الفروع والمشاريع على الخريطة
        </Typography>
      </Box>
      
      {/* شريط الفلاتر */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="company-select-label">الشركات</InputLabel>
              <Select
                labelId="company-select-label"
                multiple
                value={selectedCompanies}
                onChange={handleCompanyChange}
                input={<OutlinedInput label="الشركات" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={companies.find(c => c.id === value)?.name || ''} 
                        size="small" 
                      />
                    ))}
                  </Box>
                )}
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    <Checkbox checked={selectedCompanies.indexOf(company.id) > -1} />
                    <ListItemText primary={company.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <ToggleButtonGroup
              value={viewType}
              exclusive
              onChange={handleViewTypeChange}
              aria-label="نوع العرض"
              fullWidth
              size="small"
            >
              <ToggleButton value="all" aria-label="الكل">
                الكل
              </ToggleButton>
              <ToggleButton value="branches" aria-label="الفروع">
                الفروع
              </ToggleButton>
              <ToggleButton value="projects" aria-label="المشاريع">
                المشاريع
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>
      
      <Grid container spacing={3}>
        {/* الخريطة */}
        <Grid item xs={12} md={8}>
          <MapComponent 
            markers={markers} 
            onMarkerClick={handleMarkerClick} 
            mapType="satellite"
            selectedItem={selectedItem ? { id: selectedItem.id, type: selectedType } : null}
          />
        </Grid>
        
        {/* التفاصيل والقائمة */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3} direction="column">
            {/* بطاقة التفاصيل */}
            <Grid item xs={12}>
              <Card sx={{ height: '100%', minHeight: 250 }}>
                {selectedItem ? (
                  <LocationDetailsCard item={selectedItem} type={selectedType} />
                ) : (
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                    <Typography variant="body1" color="text.secondary" align="center">
                      اختر موقعًا من الخريطة لعرض التفاصيل
                    </Typography>
                  </CardContent>
                )}
              </Card>
            </Grid>
            
            {/* قائمة المواقع */}
            <Grid item xs={12}>
              <Card sx={{ height: '100%', maxHeight: 300, overflow: 'auto' }}>
                <CardContent sx={{ p: 0 }}>
                  <List>
                    <ListItem>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Typography variant="subtitle1">المواقع</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', fontSize: 14, color: 'text.secondary' }}>
                          <FilterAltIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="caption">{filteredLocations.length} موقع</Typography>
                        </Box>
                      </Box>
                    </ListItem>
                    <Divider />
                    {filteredLocations.length === 0 ? (
                      <ListItem>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ width: '100%', py: 2 }}>
                          لا توجد مواقع تطابق المعايير المحددة
                        </Typography>
                      </ListItem>
                    ) : (
                      filteredLocations.map((location) => (
                        <ListItem key={`${location.type}-${location.id}`} disablePadding>
                          <ListItemButton 
                            onClick={() => handleLocationItemClick(location)}
                            selected={selectedItem && selectedItem.id === location.data.id && selectedType === location.type}
                          >
                            <ListItemIcon>
                              {location.type === 'branch' ? (
                                <BusinessIcon color="primary" />
                              ) : (
                                <AccountTreeIcon color="secondary" />
                              )}
                            </ListItemIcon>
                            <ListItemText 
                              primary={location.name} 
                              secondary={location.type === 'branch' 
                                ? `${location.companyName} - ${location.data.address}` 
                                : `${location.branchName} - ${location.companyName}`
                              } 
                            />
                          </ListItemButton>
                        </ListItem>
                      ))
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MapView; 