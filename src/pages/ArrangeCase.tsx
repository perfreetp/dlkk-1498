import { useState, useMemo } from 'react';
import { useCaseStore } from '@/store/useCaseStore';
import { Steps } from '@/components/business/Steps';
import { mockScenarios, mockAvailableItems } from '@/mock/cases';
import {
  FileText,
  Clock,
  CheckSquare,
  ChevronRight,
  Info,
  Shield,
  Building,
  Stethoscope,
  Users,
  DollarSign,
  ListChecks,
  ScrollText,
  ArrowLeft,
  Send,
  Printer,
} from 'lucide-react';
import type { SelectedItem, ScenarioItem } from '@/types';

const steps = [
  { title: '叫号取件', description: '排队叫号' },
  { title: '信息核验', description: '材料审核' },
  { title: '联办编排', description: '事项选择' },
  { title: '受理提交', description: '业务办理' },
  { title: '办结出证', description: '结果送达' },
];

const departmentIcons: Record<string, typeof Building> = {
  公安局: Shield,
  人社局: Users,
  医保局: Building,
  卫健委: Stethoscope,
};

const departmentColors: Record<string, string> = {
  公安局: 'bg-blue-100 text-blue-600',
  人社局: 'bg-green-100 text-green-600',
  医保局: 'bg-purple-100 text-purple-600',
  卫健委: 'bg-red-100 text-red-600',
};

const mockMaterialsByItem: Record<string, Array<{ name: string; required: boolean }>> = {
  s1: [
    { name: '出生医学证明原件及复印件', required: true },
    { name: '父母双方居民身份证原件及复印件', required: true },
    { name: '父母双方户口簿原件及复印件', required: true },
    { name: '结婚证原件及复印件', required: true },
    { name: '房产证或居住证明（适用时）', required: false },
  ],
  s2: [
    { name: '出生医学证明原件及复印件', required: true },
    { name: '父母双方居民身份证原件', required: true },
    { name: '户口簿原件', required: true },
  ],
  s3: [
    { name: '出生医学证明原件及复印件', required: true },
    { name: '父母双方居民身份证原件', required: true },
    { name: '户口簿原件', required: true },
    { name: '结婚证原件', required: true },
  ],
  s4: [
    { name: '出生医学证明原件', required: true },
    { name: '父母双方居民身份证原件', required: true },
    { name: '户口簿原件', required: true },
  ],
  s5: [
    { name: '出生医学证明原件及复印件', required: true },
    { name: '生育服务证', required: true },
    { name: '结婚证原件及复印件', required: true },
    { name: '本人身份证原件', required: true },
    { name: '医院费用清单', required: true },
    { name: '出院小结', required: true },
  ],
  s6: [
    { name: '父母双方居民身份证原件', required: true },
    { name: '结婚证原件', required: true },
    { name: '出院记录', required: true },
    { name: '新生儿姓名确认单', required: true },
  ],
};

export default function ArrangeCase() {
  const { currentCase, updateCase } = useCaseStore();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [items, setItems] = useState<SelectedItem[]>(
    currentCase?.selectedItems ||
      mockAvailableItems.map((item) => ({ ...item }))
  );

  const departments = useMemo(() => {
    const deptMap = new Map<string, SelectedItem[]>();
    items.forEach((item) => {
      if (!deptMap.has(item.department)) {
        deptMap.set(item.department, []);
      }
      deptMap.get(item.department)!.push(item);
    });
    return Array.from(deptMap.entries());
  }, [items]);

  const selectedItems = useMemo(() => items.filter((item) => item.selected), [items]);

  const maxHandlingTime = useMemo(() => {
    if (selectedItems.length === 0) return 0;
    return Math.max(...selectedItems.map((item) => item.handlingTime));
  }, [selectedItems]);

  const totalFee = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (item.fee || 0), 0);
  }, [selectedItems]);

  const handleScenarioClick = (scenario: ScenarioItem) => {
    setSelectedScenario(scenario.id);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: scenario.itemIds.includes(item.id),
      }))
    );
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedScenario(null);
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handlePrev = () => {
    console.log('上一步');
  };

  const handleGenerateNotice = () => {
    console.log('生成告知单');
  };

  const handleSubmit = () => {
    if (currentCase && selectedItems.length > 0) {
      updateCase(currentCase.id, {
        selectedItems: selectedItems,
        status: 'processing',
      });
    }
    console.log('提交受理');
  };

  const getAllMaterials = () => {
    const materialSet = new Set<string>();
    const materials: Array<{ name: string; required: boolean }> = [];
    selectedItems.forEach((item) => {
      const itemMaterials = mockMaterialsByItem[item.id] || [];
      itemMaterials.forEach((mat) => {
        if (!materialSet.has(mat.name)) {
          materialSet.add(mat.name);
          materials.push(mat);
        }
      });
    });
    return materials.sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">出生一件事联办编排</h1>
            <p className="text-sm text-gray-500 mt-1">
              办件编号：{currentCase?.caseNo || 'CS202606170001'} | 申请人：
              {currentCase?.applicant.name || '张伟'} | 新生儿：
              {currentCase?.babyInfo.name || '张小明'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">当前窗口：</span>
            <span className="px-3 py-1 bg-primary-50 text-primary-600 text-sm font-medium rounded">
              01号窗口
            </span>
          </div>
        </div>
        <div className="flex justify-center">
          <Steps steps={steps} current={2} />
        </div>
      </div>

      <div className="flex gap-6 p-6 pb-24">
        <div className="flex-1 space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="text-primary-500" size={20} />
              <h2 className="text-base font-semibold text-gray-800">常见情形选择</h2>
              <span className="text-xs text-gray-400 ml-2">
                选择套餐可快速勾选对应事项
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {mockScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  onClick={() => handleScenarioClick(scenario)}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedScenario === scenario.id
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-gray-200 hover:border-primary-300 hover:shadow-sm'
                  }`}
                >
                  {scenario.id === 'sc1' && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded">
                      推荐
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedScenario === scenario.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <CheckSquare size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 mb-1">{scenario.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {scenario.description}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-gray-400">包含</span>
                        <span className="text-xs font-medium text-primary-600">
                          {scenario.itemIds.length}
                        </span>
                        <span className="text-xs text-gray-400">个事项</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-primary-500" size={20} />
                <h2 className="text-base font-semibold text-gray-800">联办事项选择</h2>
              </div>
              <div className="text-sm text-gray-500">
                已选 <span className="text-primary-600 font-medium">{selectedItems.length}</span>{' '}
                项
              </div>
            </div>

            <div className="space-y-5">
              {departments.map(([department, deptItems]) => {
                const IconComp = departmentIcons[department] || Building;
                const selectedCount = deptItems.filter((item) => item.selected).length;
                return (
                  <div key={department} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${departmentColors[department] || 'bg-gray-100 text-gray-600'}`}>
                          <IconComp size={16} />
                        </div>
                        <span className="font-medium text-gray-800">{department}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        已选 {selectedCount}/{deptItems.length}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {deptItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleItemToggle(item.id)}
                          className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                            item.selected
                              ? 'bg-primary-50/50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                item.selected
                                  ? 'bg-primary-500 border-primary-500'
                                  : 'border-gray-300'
                              }`}
                            >
                              {item.selected && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800 text-sm">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {item.scenario}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>{item.handlingTime}个工作日</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={12} />
                              <span>
                                {(item.fee || 0) === 0 ? '免费' : `¥${item.fee}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-primary-500" size={20} />
              <h2 className="text-base font-semibold text-gray-800">办理时限汇总</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <div className="text-3xl font-bold text-primary-600">{selectedItems.length}</div>
                <div className="text-sm text-gray-600 mt-1">已选事项</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{maxHandlingTime}</div>
                <div className="text-sm text-gray-600 mt-1">最长办理时限（工作日）</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{totalFee === 0 ? '免费' : `¥${totalFee}`}</div>
                <div className="text-sm text-gray-600 mt-1">总费用</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <Info className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">温馨提示</p>
                <p className="mt-1">
                  以上办理时限为各部门承诺的最长办理时限，实际办理时间可能因材料齐全程度等因素有所不同。
                  如遇特殊情况需延长办理时限，将另行通知。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[420px] flex-shrink-0">
          <div className="card p-5 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ScrollText className="text-primary-500" size={20} />
                <h2 className="text-base font-semibold text-gray-800">一次告知单预览</h2>
              </div>
              <button className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
                <Printer size={14} />
                打印
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-5 bg-white max-h-[calc(100vh-280px)] overflow-y-auto">
              <div className="text-center mb-5 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">出生一件事联办一次告知单</h3>
                <p className="text-xs text-gray-500 mt-1">
                  办件编号：{currentCase?.caseNo || 'CS202606170001'}
                </p>
                <p className="text-xs text-gray-500">
                  打印时间：{new Date().toLocaleDateString('zh-CN')}
                </p>
              </div>

              <div className="space-y-5 text-sm">
                {selectedItems.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p>请选择联办事项</p>
                    <p className="text-xs mt-1">选择事项后此处将显示告知单内容</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                        <Info size={14} className="text-primary-500" />
                        办事须知
                      </h4>
                      <ul className="space-y-1 text-gray-600 text-xs pl-5 list-decimal">
                        <li>
                          申请人应对所提交材料的真实性负责，如提供虚假材料，将承担相应法律责任。
                        </li>
                        <li>
                          请确保所留联系电话准确无误，以便工作人员与您联系。
                        </li>
                        <li>
                          办理时限自受理之日起计算，不含法定节假日。
                        </li>
                        <li>
                          请在规定时限内及时补正材料，逾期未补正的将视为自动放弃申请。
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                        <FileText size={14} className="text-primary-500" />
                        申请材料清单
                      </h4>
                      <div className="space-y-1.5">
                        {getAllMaterials().map((material, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-xs py-1.5 px-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <CheckSquare size={12} className="text-gray-400" />
                              <span className="text-gray-700">{material.name}</span>
                            </div>
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs ${
                                material.required
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {material.required ? '必需' : '可选'}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        共 {getAllMaterials().filter((m) => m.required).length} 项必需材料，
                        {getAllMaterials().filter((m) => !m.required).length} 项可选材料
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                        <ListChecks size={14} className="text-primary-500" />
                        联办事项列表
                      </h4>
                      <div className="space-y-2">
                        {selectedItems.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 text-xs py-2 px-3 bg-primary-50/50 rounded border border-primary-100"
                          >
                            <span className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-800">{item.name}</div>
                              <div className="text-gray-500 text-xs mt-0.5">{item.department}</div>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock size={10} />
                                {item.handlingTime}工作日
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                        <Clock size={14} className="text-primary-500" />
                        办理时限
                      </h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>
                          最长办理时限：
                          <span className="font-medium text-orange-600">
                            {maxHandlingTime} 个工作日
                          </span>
                        </p>
                        <p className="text-gray-500">
                          （各事项并行办理，以最长时限为准）
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                        <DollarSign size={14} className="text-primary-500" />
                        收费标准
                      </h4>
                      <div className="text-xs text-gray-600">
                        {totalFee === 0 ? (
                          <p>本次联办事项均不收取费用。</p>
                        ) : (
                          <p>
                            预计总费用：
                            <span className="font-medium text-green-600">¥{totalFee}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                        <ChevronRight size={14} className="text-primary-500" />
                        办理流程
                      </h4>
                      <ol className="space-y-1.5 text-xs text-gray-600 pl-5 list-decimal">
                        <li>提交申请材料，窗口工作人员核验信息</li>
                        <li>确认联办事项，签署相关申请表格</li>
                        <li>各部门后台并联审批办理</li>
                        <li>办理完成后，通过短信通知申请人</li>
                        <li>申请人可选择窗口自取或邮寄送达办理结果</li>
                      </ol>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-center">
                        咨询电话：12345 | 监督电话：12345
                      </p>
                      <p className="text-xs text-gray-400 text-center mt-1">
                        本告知单仅作参考，具体以实际办理为准
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between z-10">
        <div className="text-sm text-gray-500">
          已选择 <span className="text-primary-600 font-medium">{selectedItems.length}</span> 个联办事项
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handlePrev} className="btn-secondary flex items-center gap-1.5">
            <ArrowLeft size={16} />
            上一步
          </button>
          <button
            onClick={handleGenerateNotice}
            disabled={selectedItems.length === 0}
            className={`btn-secondary flex items-center gap-1.5 ${
              selectedItems.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            <FileText size={16} />
            生成告知单
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedItems.length === 0}
            className={`btn-primary flex items-center gap-1.5 ${
              selectedItems.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            <Send size={16} />
            提交受理
          </button>
        </div>
      </div>
    </div>
  );
}
