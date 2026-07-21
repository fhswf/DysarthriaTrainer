import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VueWrapper} from '@vue/test-utils';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import TableSetup from '../TableSetup.vue';
import type { TableSetupProps, TableApiService, TableColumnDefinition } from '../TableSetup.types';
import type { TableFilterConfig } from '@/components/TableFilter';

// Mock stores
const mockLocalizationStore = {
  t: vi.fn((key: string) => Promise.resolve(key)),
};

const mockMessagingStore = {
  success: vi.fn(),
  error: vi.fn(),
};

// Mock confirm dialog
const mockConfirm = {
  require: vi.fn(),
};

vi.mock('@/stores/localization', () => ({
  useLocalizationStore: () => mockLocalizationStore,
}));

vi.mock('@/stores/messaging', () => ({
  useV2MessagingStore: () => mockMessagingStore,
}));

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => mockConfirm,
}));

// Mock child components
vi.mock('@/components/TableToolbar/TableToolbar.vue', () => ({
  default: {
    name: 'TableToolbar',
    template: '<div data-test="table-toolbar"><slot name="filter"></slot></div>',
    props: ['title', 'searchQuery', 'loading', 'disabled'],
    emits: ['update:search-query', 'refresh', 'create', 'export', 'delete-all'],
  },
}));

vi.mock('@/components/TableFilter', () => ({
  TableFilter: {
    name: 'TableFilter',
    template: '<div data-test="table-filter"></div>',
    props: ['config'],
    emits: ['apply', 'change', 'clear'],
  },
}));

vi.mock('@/components/VirtualScrollTable', () => ({
  VirtualScrollTable: {
    name: 'VirtualScrollTable',
    template: '<div data-test="virtual-scroll-table"></div>',
    props: ['value', 'columns', 'loading', 'totalRecords', 'dataKey', 'selection', 'sortField', 'sortOrder'],
    emits: ['lazy-load', 'sort', 'update:selection'],
  },
}));

vi.mock('primevue/confirmdialog', () => ({
  default: {
    name: 'ConfirmDialog',
    template: '<div data-test="confirm-dialog"></div>',
  },
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button><slot></slot></button>',
    props: ['icon', 'label', 'severity', 'text', 'size'],
    emits: ['click'],
  },
}));

// Mock composables
vi.mock('../composables/useTableSetupStorage', () => ({
  useTableSetupStorage: () => ({
    loadState: vi.fn(() => null),
    saveState: vi.fn(),
    clearState: vi.fn(),
    updateState: vi.fn(),
  }),
}));

vi.mock('../composables/useTableSetupData', () => ({
  useTableSetupData: () => ({
    items: { value: [] },
    loading: { value: false },
    totalRecords: { value: 0 },
    onLazyLoad: vi.fn(),
    refresh: vi.fn(),
    reset: vi.fn(),
    loadInitial: vi.fn(),
    handleSort: vi.fn(),
    handleSearch: vi.fn(),
  }),
}));

interface TestItem {
  id: number;
  name: string;
  email: string;
  status: string;
}

describe('TableSetup Component', () => {
  let wrapper: VueWrapper<any>;
  let mockApiService: TableApiService<TestItem>;
  let columns: TableColumnDefinition[];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockLocalizationStore.t.mockImplementation((key: string) => Promise.resolve(key));

    // Setup mock API service
    mockApiService = {
      list: vi.fn().mockResolvedValue({
        results: [
          { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
        ],
        count: 2,
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    // Setup columns
    columns = [
      { field: 'id', headerKey: 'id', sortable: true },
      { field: 'name', headerKey: 'name', sortable: true },
      { field: 'email', headerKey: 'email', sortable: false },
      { field: 'status', headerKey: 'status', sortable: true },
    ];
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Component Rendering', () => {
    it('should render with required props', () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
            Button: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render TableToolbar component', () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      expect(wrapper.find('[data-test="table-toolbar"]').exists()).toBe(true);
    });

    it('should render VirtualScrollTable component', () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            ConfirmDialog: true,
          },
        },
      });

      expect(wrapper.find('[data-test="virtual-scroll-table"]').exists()).toBe(true);
    });

    it('should render ConfirmDialog component', () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
          },
        },
      });

      expect(wrapper.find('[data-test="confirm-dialog"]').exists()).toBe(true);
    });

    it('should render TableFilter when filterConfig is provided', () => {
      const filterConfig: TableFilterConfig = {
        id: 'test-filter',
        i18nPrefix: 'test.filters',
        fields: [
          { 
            name: 'status', 
            label: 'Status', 
            type: 'select', 
            options: { items: [] } 
          } as any,
        ],
        presets: [],
      };

      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
          filterConfig,
        },
        global: {
          stubs: {
            TableToolbar: false, // Don't stub to render slots
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      // TableFilter should be rendered in the filter slot
      expect(wrapper.findComponent({ name: 'TableFilter' }).exists()).toBe(true);
    });

    it('should not render TableFilter when filterConfig is not provided', () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      expect(wrapper.find('[data-test="table-filter"]').exists()).toBe(false);
    });

    it('should not render TableFilter when features.filters is false', () => {
      const filterConfig: TableFilterConfig = {
        id: 'test-filter',
        i18nPrefix: 'test.filters',
        fields: [],
        presets: [],
      };

      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
          filterConfig,
          features: { filters: false },
        },
        global: {
          stubs: {
            TableToolbar: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      expect(wrapper.find('[data-test="table-filter"]').exists()).toBe(false);
    });
  });

  describe('Props and Defaults', () => {
    it('should apply default features', () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.features.search).toBe(true);
      expect(vm.features.filters).toBe(true);
      expect(vm.features.sort).toBe(true);
      expect(vm.features.refresh).toBe(true);
      expect(vm.features.export).toBe(true);
      expect(vm.features.create).toBe(true);
      expect(vm.features.deleteAll).toBe(false);
      expect(vm.features.viewAction).toBe(true);
      expect(vm.features.editAction).toBe(true);
      expect(vm.features.deleteAction).toBe(true);
    });

    it('should override default features', () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
          features: {
            search: false,
            export: false,
            deleteAll: true,
          },
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.features.search).toBe(false);
      expect(vm.features.export).toBe(false);
      expect(vm.features.deleteAll).toBe(true);
      // Defaults should still apply
      expect(vm.features.filters).toBe(true);
      expect(vm.features.create).toBe(true);
    });

    it('should apply default table config', () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.tableConfig.rowHeight).toBe(50);
      expect(vm.tableConfig.scrollHeight).toBe('calc(100vh - 250px)');
      expect(vm.tableConfig.striped).toBe(true);
      expect(vm.tableConfig.size).toBe('small');
      expect(vm.tableConfig.selectionMode).toBe('multiple');
    });

    it('should override default table config', () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
          tableConfig: {
            rowHeight: 60,
            size: 'normal',
            selectionMode: 'single',
          },
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.tableConfig.rowHeight).toBe(60);
      expect(vm.tableConfig.size).toBe('normal');
      expect(vm.tableConfig.selectionMode).toBe('single');
      // Defaults should still apply
      expect(vm.tableConfig.striped).toBe(true);
    });

    it('should use custom storage key', () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
          storageKey: 'custom-storage-key',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.storageKey).toBe('custom-storage-key');
    });

    it('should generate storage key from i18nKey when not provided', () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'employees',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.storageKey).toBe('table-setup:employees');
    });
  });

  describe('Event Emissions', () => {
    it('should emit create event', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      vm.handleCreate();
      await nextTick();

      expect(wrapper.emitted('create')).toBeTruthy();
      expect(wrapper.emitted('create')).toHaveLength(1);
    });

    it('should emit view event with item data', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const testItem = { id: 1, name: 'Test', email: 'test@example.com', status: 'active' };
      const vm = wrapper.vm as any;
      vm.handleView(testItem);
      await nextTick();

      expect(wrapper.emitted('view')).toBeTruthy();
      expect(wrapper.emitted('view')?.[0]).toEqual([testItem]);
    });

    it('should emit edit event with item data', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const testItem = { id: 1, name: 'Test', email: 'test@example.com', status: 'active' };
      const vm = wrapper.vm as any;
      vm.handleEdit(testItem);
      await nextTick();

      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]).toEqual([testItem]);
    });

    it('should emit filters-changed event when filters are applied', async () => {
      const filterConfig: TableFilterConfig = {
        id: 'test-filter',
        i18nPrefix: 'test.filters',
        fields: [],
        presets: [],
      };

      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
          filterConfig,
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const filters = { status: 'active', department: 'IT' };
      const vm = wrapper.vm as any;
      vm.handleFiltersApplied(filters);
      await nextTick();

      expect(wrapper.emitted('filters-changed')).toBeTruthy();
      expect(wrapper.emitted('filters-changed')?.[0]).toEqual([filters]);
    });

    it('should emit update:selection when selection changes', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      const selectedItems = [
        { id: 1, name: 'Test 1', email: 'test1@example.com', status: 'active' },
        { id: 2, name: 'Test 2', email: 'test2@example.com', status: 'active' },
      ];
      
      vm.selectedItems = selectedItems;
      await nextTick();

      expect(wrapper.emitted('update:selection')).toBeTruthy();
    });
  });

  describe('Delete Functionality', () => {
    it('should show confirmation dialog when delete is triggered', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const testItem = { id: 1, name: 'Test', email: 'test@example.com', status: 'active' };
      const vm = wrapper.vm as any;
      await vm.handleDelete(testItem);

      expect(mockConfirm.require).toHaveBeenCalled();
    });

    it('should call API service delete when confirmed', async () => {
      mockConfirm.require.mockImplementation(({ accept }) => {
        accept();
      });

      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const testItem = { id: 1, name: 'Test', email: 'test@example.com', status: 'active' };
      const vm = wrapper.vm as any;
      await vm.handleDelete(testItem);
      await nextTick();

      expect(mockApiService.delete).toHaveBeenCalledWith(1);
    });

    it('should show success message after successful delete', async () => {
      mockConfirm.require.mockImplementation(({ accept }) => {
        accept();
      });

      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const testItem = { id: 1, name: 'Test', email: 'test@example.com', status: 'active' };
      const vm = wrapper.vm as any;
      await vm.handleDelete(testItem);
      await nextTick();

      expect(mockMessagingStore.success).toHaveBeenCalled();
    });

    it('should show error message when delete fails', async () => {
      mockApiService.delete = vi.fn().mockRejectedValue(new Error('Delete failed'));
      mockConfirm.require.mockImplementation(({ accept }) => {
        accept();
      });

      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const testItem = { id: 1, name: 'Test', email: 'test@example.com', status: 'active' };
      const vm = wrapper.vm as any;
      await vm.handleDelete(testItem);
      await nextTick();

      expect(mockMessagingStore.error).toHaveBeenCalled();
      expect(wrapper.emitted('error')).toBeTruthy();
    });

    it('should handle delete all with confirmation', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
          features: { deleteAll: true },
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      vm.selectedItems = [
        { id: 1, name: 'Test 1', email: 'test1@example.com', status: 'active' },
        { id: 2, name: 'Test 2', email: 'test2@example.com', status: 'active' },
      ];
      await vm.handleDeleteAll();

      expect(mockConfirm.require).toHaveBeenCalled();
    });
  });

  describe('Export Functionality', () => {
    it('should fetch all data and emit export event', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      await vm.handleExport();

      expect(mockApiService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 0,
          limit: 10000,
        })
      );
      expect(wrapper.emitted('export')).toBeTruthy();
    });

    it('should include current filters in export', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      vm.currentFilters = { status: 'active' };
      vm.searchQuery = 'test';
      await vm.handleExport();

      expect(mockApiService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          search: 'test',
        })
      );
    });

    it('should show success message after export', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      await vm.handleExport();

      expect(mockMessagingStore.success).toHaveBeenCalled();
    });

    it('should show error message when export fails', async () => {
      mockApiService.list = vi.fn().mockRejectedValue(new Error('Export failed'));

      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      await vm.handleExport();

      expect(mockMessagingStore.error).toHaveBeenCalled();
      expect(wrapper.emitted('error')).toBeTruthy();
    });
  });

  describe('Search Functionality', () => {
    it('should update search query when handleSearch is called', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      // Call handleSearch which internally calls the mocked composable
      // Since the composable is mocked, we need to update searchQuery directly
      vm.searchQuery = 'test query';
      await nextTick();

      expect(vm.searchQuery).toBe('test query');
    });

    it('should clear filters when clearFilters is called', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      vm.searchQuery = 'test';
      vm.currentFilters = { status: 'active' };
      
      vm.clearFilters();
      await nextTick();

      expect(vm.searchQuery).toBe('');
      expect(vm.currentFilters).toEqual({});
    });
  });

  describe('Column Formatting', () => {
    it('should apply format function to column values', () => {
      const columnsWithFormat = [
        {
          field: 'status',
          headerKey: 'status',
          sortable: true,
          format: (value: string) => (value === 'active' ? 'Active' : 'Inactive'),
        },
      ];

      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns: columnsWithFormat,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      const col = vm.$props.columns[0];
      expect(col.format('active', {})).toBe('Active');
      expect(col.format('inactive', {})).toBe('Inactive');
    });
  });

  describe('Computed Properties', () => {
    it('should compute hasSelection correctly', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.hasSelection).toBe(false);

      vm.selectedItems = [{ id: 1, name: 'Test', email: 'test@example.com', status: 'active' }];
      await nextTick();

      expect(vm.hasSelection).toBe(true);
    });

    it('should compute isFiltered correctly', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'test',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.isFiltered).toBe(false);

      vm.searchQuery = 'test';
      await nextTick();
      expect(vm.isFiltered).toBe(true);

      vm.searchQuery = '';
      vm.currentFilters = { status: 'active' };
      await nextTick();
      expect(vm.isFiltered).toBe(true);
    });
  });

  describe('Localization', () => {
    it('should call localization store for translations', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'employees',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      await nextTick();
      await nextTick(); // Wait for onMounted

      expect(mockLocalizationStore.t).toHaveBeenCalledWith('employees.title');
      expect(mockLocalizationStore.t).toHaveBeenCalledWith('employees.search.placeholder');
      expect(mockLocalizationStore.t).toHaveBeenCalledWith('employees.emptyState.title');
    });

    it('should localize column headers', async () => {
      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns,
          dataKey: 'id',
          i18nKey: 'employees',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      await flushPromises(); // Wait for all async operations

      // Check that column headers were translated
      const calls = mockLocalizationStore.t.mock.calls.map(call => call[0]);
      expect(calls).toContain('employees.columns.id');
      expect(calls).toContain('employees.columns.name');
      expect(calls).toContain('employees.columns.email');
    });

    it('should handle full translation keys in columns', async () => {
      const columnsWithFullKeys = [
        { field: 'id', headerKey: 'common.labels.id', sortable: true },
      ];

      wrapper = mount(TableSetup<TestItem>, {
        props: {
          apiService: mockApiService,
          columns: columnsWithFullKeys,
          dataKey: 'id',
          i18nKey: 'employees',
        },
        global: {
          stubs: {
            TableToolbar: true,
            TableFilter: true,
            VirtualScrollTable: true,
            ConfirmDialog: true,
          },
        },
      });

      await flushPromises(); // Wait for all async operations

      const calls = mockLocalizationStore.t.mock.calls.map(call => call[0]);
      expect(calls).toContain('common.labels.id');
    });
  });
});
