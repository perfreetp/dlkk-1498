import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCaseStore } from '@/store/useCaseStore';
import { StatusBadge } from '@/components/business/StatusBadge';
import { mockSupplementTemplates } from '@/mock/cases';
import {
  FileText,
  Clock,
  AlertCircle,
  Send,
  Save,
  X,
  ChevronRight,
  Copy,
  CheckSquare,
  Square,
  User,
  Baby,
  FileCheck,
  Calendar,
  MessageSquare,
  ListChecks,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { CaseInfo, SupplementTemplate, CaseStatus } from '@/types';

type TabKey = 'pending' | 'submitted';

export default function SupplementCase() {
  const { cases, updateCase, currentUser, addFlowRecord, getCaseById } = useCaseStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [supplementReason, setSupplementReason] = useState('');
  const [supplementDeadline, setSupplementDeadline] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [caseNotFound, setCaseNotFound] = useState(false);

  const [submittedSelectedCaseId, setSubmittedSelectedCaseId] = useState<string | null>(null);
  const [completedSupplements, setCompletedSupplements] = useState<string[]>([]);
  const [secondSupplementReason, setSecondSupplementReason] = useState('');

  const supplementCases = useMemo(() => {
    return cases.filter((c) => c.status === 'supplement' || c.status === 'verifying' || c.status === 'arranging');
  }, [cases]);

  const submittedCases = useMemo(() => {
    return cases.filter((c) => c.status === 'supplement' && c.supplements && c.supplements.length > 0);
  }, [cases]);

  const selectedCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  const submittedSelectedCase = useMemo(() => {
    return cases.find((c) => c.id === submittedSelectedCaseId) || null;
  }, [cases, submittedSelectedCaseId]);

  const templatesByCategory = useMemo(() => {
    const grouped: Record<string, SupplementTemplate[]> = {};
    mockSupplementTemplates.forEach((tpl) => {
      if (!grouped[tpl.category]) {
        grouped[tpl.category] = [];
      }
      grouped[tpl.category].push(tpl);
    });
    return grouped;
  }, []);

  const handleSelectCase = (caseItem: CaseInfo) => {
    setSelectedCaseId(caseItem.id);
    setSupplementReason(caseItem.supplements?.[0]?.reason || '');
    setSupplementDeadline(caseItem.supplements?.[0]?.deadline || '');
    setSelectedMaterials(
      caseItem.materials
        .filter((m) => !m.provided && m.required)
        .map((m) => m.id)
    );
  };

  const handleSelectSubmittedCase = (caseItem: CaseInfo) => {
    setSubmittedSelectedCaseId(caseItem.id);
    setCompletedSupplements([]);
    setSecondSupplementReason('');
  };

  useEffect(() => {
    if (id) {
      const targetCase = cases.find((c) => c.id === id);
      if (targetCase) {
        if (targetCase.status === 'supplement' && targetCase.supplements && targetCase.supplements.length > 0) {
          setActiveTab('submitted');
          handleSelectSubmittedCase(targetCase);
        } else {
          setActiveTab('pending');
          handleSelectCase(targetCase);
        }
        setCaseNotFound(false);
      } else {
        setCaseNotFound(true);
      }
    }
  }, [id, cases]);

  const handleMaterialToggle = (materialId: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId]
    );
  };

  const handleSupplementToggle = (supplementId: string) => {
    setCompletedSupplements((prev) =>
      prev.includes(supplementId)
        ? prev.filter((id) => id !== supplementId)
        : [...prev, supplementId]
    );
  };

  const handleInsertTemplate = (template: SupplementTemplate) => {
    setSupplementReason(template.content);
  };

  const handleCopyTemplate = (template: SupplementTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(template.content);
  };

  const handleSendNotice = () => {
    if (!selectedCase) return;

    const deadline = supplementDeadline || getDefaultDeadline();
    const supplementItems = selectedMaterials.map((matId, index) => {
      const material = selectedCase.materials.find((m) => m.id === matId);
      return {
        id: `sup${Date.now()}-${index}`,
        materialName: material?.name || '',
        reason: supplementReason,
        templateId: '',
        deadline: deadline,
        status: 'pending' as const,
      };
    });

    updateCase(selectedCase.id, {
      status: 'supplement',
      supplements: supplementItems,
    });

    addFlowRecord(selectedCase.id, {
      status: 'supplement',
      operator: currentUser.name,
      department: currentUser.department,
      action: '发送补正通知',
      remark: `补正原因：${supplementReason}；补正期限：${deadline}；需补正材料共${selectedMaterials.length}项`,
    });

    alert('补正通知已发送');
  };

  const handleSaveDraft = () => {
    if (!selectedCase) return;
    alert('草稿已保存');
  };

  const handleCancel = () => {
    setSelectedCaseId(null);
    setSupplementReason('');
    setSupplementDeadline('');
    setSelectedMaterials([]);
  };

  const handlePartialSupplement = () => {
    if (!submittedSelectedCase) return;
    if (completedSupplements.length === 0) {
      alert('请至少勾选一项已补齐的材料');
      return;
    }
    if (!secondSupplementReason.trim()) {
      alert('请输入二次补正意见');
      return;
    }

    const completedNames = submittedSelectedCase.supplements
      .filter((s) => completedSupplements.includes(s.id))
      .map((s) => s.materialName)
      .join('、');

    const remainingSupplements = submittedSelectedCase.supplements.filter(
      (s) => !completedSupplements.includes(s.id)
    );
    const deadline = getDefaultDeadline();
    const updatedSupplements = remainingSupplements.map((s) => ({
      ...s,
      deadline,
      reason: secondSupplementReason,
    }));

    addFlowRecord(submittedSelectedCase.id, {
      status: 'supplement',
      operator: currentUser.name,
      department: currentUser.department,
      action: '确认部分材料补齐',
      remark: `已补齐材料：${completedNames}；仍需补正材料共${remainingSupplements.length}项`,
    });

    addFlowRecord(submittedSelectedCase.id, {
      status: 'supplement',
      operator: currentUser.name,
      department: currentUser.department,
      action: '二次补正通知',
      remark: `补正原因：${secondSupplementReason}；补正期限：${deadline}；需补正材料共${remainingSupplements.length}项`,
    });

    const updatedMaterials = submittedSelectedCase.materials.map((m) => {
      const isCompleted = submittedSelectedCase.supplements.some(
        (s) => completedSupplements.includes(s.id) && s.materialName.includes(m.name)
      );
      return isCompleted ? { ...m, provided: true } : m;
    });

    updateCase(submittedSelectedCase.id, {
      status: 'supplement',
      supplements: updatedSupplements,
      materials: updatedMaterials,
    });

    setCompletedSupplements([]);
    setSecondSupplementReason('');
    alert('二次补正通知已发送');
  };

  const handleFullSupplement = () => {
    if (!submittedSelectedCase) return;
    if (completedSupplements.length !== submittedSelectedCase.supplements.length) {
      const confirmed = window.confirm(
        `当前仅勾选 ${completedSupplements.length}/${submittedSelectedCase.supplements.length} 项材料，确认全部补齐并恢复办理吗？`
      );
      if (!confirmed) return;
    }

    const allSupplementNames = submittedSelectedCase.supplements
      .map((s) => s.materialName)
      .join('、');

    addFlowRecord(submittedSelectedCase.id, {
      status: 'supplement',
      operator: currentUser.name,
      department: currentUser.department,
      action: '补正材料已补齐',
      remark: `申请人已提交以下材料：${allSupplementNames}`,
    });

    const hasBeenArranged = submittedSelectedCase.flowRecords.some(
      (r) => r.status === 'arranging' || r.status === 'processing'
    );
    const nextStatus: CaseStatus = hasBeenArranged ? 'processing' : 'arranging';

    addFlowRecord(submittedSelectedCase.id, {
      status: nextStatus,
      operator: currentUser.name,
      department: currentUser.department,
      action: '恢复办理流程',
      remark: '材料完整，送回办理',
    });

    const updatedMaterials = submittedSelectedCase.materials.map((m) => {
      const isInSupplement = submittedSelectedCase.supplements.some(
        (s) => s.materialName.includes(m.name)
      );
      return isInSupplement ? { ...m, provided: true } : m;
    });

    updateCase(submittedSelectedCase.id, {
      status: nextStatus,
      supplements: [],
      materials: updatedMaterials,
    });

    setSubmittedSelectedCaseId(null);
    setCompletedSupplements([]);

    if (nextStatus === 'arranging') {
      navigate(`/arrange/${submittedSelectedCase.id}`);
    } else {
      alert('办件已恢复办理');
    }
  };

  const getDefaultDeadline = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const getSupplementCount = (caseItem: CaseInfo) => {
    return caseItem.materials.filter((m) => !m.provided && m.required).length;
  };

  const getSupplementDeadlineDisplay = (caseItem: CaseInfo) => {
    if (caseItem.supplements?.[0]?.deadline) {
      return caseItem.supplements[0].deadline;
    }
    return '-';
  };

  const renderPendingTab = () => (
    <div className="flex gap-6 p-6 h-[calc(100vh-176px)]">
      <div className="w-[480px] flex-shrink-0 flex flex-col">
        <div className="card p-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListChecks className="text-primary-500" size={20} />
              <h2 className="text-base font-semibold text-gray-800">待补正列表</h2>
            </div>
            <span className="text-xs text-gray-500">
              共 {supplementCases.length} 条
            </span>
          </div>

          <div className="flex-1 overflow-auto -mx-4 px-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-gray-500 text-xs">
                  <th className="py-2.5 px-2 font-medium">联办单号</th>
                  <th className="py-2.5 px-2 font-medium">申请人</th>
                  <th className="py-2.5 px-2 font-medium">新生儿</th>
                  <th className="py-2.5 px-2 font-medium">补正材料</th>
                  <th className="py-2.5 px-2 font-medium">补正期限</th>
                  <th className="py-2.5 px-2 font-medium">状态</th>
                  <th className="py-2.5 px-2 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {supplementCases.map((caseItem) => (
                  <tr
                    key={caseItem.id}
                    className={`cursor-pointer transition-colors ${
                      selectedCaseId === caseItem.id
                        ? 'bg-primary-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectCase(caseItem)}
                  >
                    <td className="py-3 px-2">
                      <span className="text-gray-800 font-medium text-xs">
                        {caseItem.caseNo}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-gray-700">{caseItem.applicant.name}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-gray-700">{caseItem.babyInfo.name}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center gap-1 text-orange-600 font-medium">
                        <AlertCircle size={14} />
                        {getSupplementCount(caseItem)}项
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-gray-600 text-xs">
                        {getSupplementDeadlineDisplay(caseItem)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge status={caseItem.status} />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button className="text-primary-600 hover:text-primary-700 text-xs flex items-center gap-0.5 ml-auto">
                        查看
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {supplementCases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      <FileText size={48} className="mx-auto mb-3 opacity-50" />
                      <p>暂无待补正办件</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedCase ? (
          <div className="card p-5 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileCheck className="text-primary-500" size={20} />
                <h2 className="text-base font-semibold text-gray-800">补正详情</h2>
              </div>
              <StatusBadge status={selectedCase.status} />
            </div>

            <div className="flex-1 overflow-auto space-y-5">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="text-primary-500" size={16} />
                  <h3 className="font-medium text-gray-800 text-sm">办件基本信息</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 flex-shrink-0">联办单号：</span>
                    <span className="text-gray-800 font-medium">{selectedCase.caseNo}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 flex-shrink-0">叫号编号：</span>
                    <span className="text-gray-800">{selectedCase.queueNo || '-'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <User size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-500">申请人：</span>
                      <span className="text-gray-800">{selectedCase.applicant.name}</span>
                      <span className="text-gray-400 ml-2 text-xs">
                        ({selectedCase.applicant.relation})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 flex-shrink-0">联系电话：</span>
                    <span className="text-gray-800">{selectedCase.applicant.phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Baby size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-500">新生儿：</span>
                      <span className="text-gray-800">{selectedCase.babyInfo.name}</span>
                      <span className="text-gray-400 ml-2 text-xs">
                        ({selectedCase.babyInfo.gender === 'male' ? '男' : '女'})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-500">出生日期：</span>
                      <span className="text-gray-800">{selectedCase.babyInfo.birthDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="text-primary-500" size={16} />
                  <h3 className="font-medium text-gray-800 text-sm">补正材料清单</h3>
                  <span className="text-xs text-gray-400">
                    勾选需要申请人补正的材料
                  </span>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {selectedCase.materials.map((material) => (
                    <div
                      key={material.id}
                      onClick={() => handleMaterialToggle(material.id)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                        selectedMaterials.includes(material.id)
                          ? 'bg-primary-50/50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {selectedMaterials.includes(material.id) ? (
                          <CheckSquare
                            size={18}
                            className="text-primary-500 flex-shrink-0"
                          />
                        ) : (
                          <Square
                            size={18}
                            className="text-gray-300 flex-shrink-0"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-800 text-sm font-medium">
                              {material.name}
                            </span>
                            {material.required && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                                必需
                              </span>
                            )}
                            {!material.provided && (
                              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs rounded">
                                未提供
                              </span>
                            )}
                          </div>
                          {material.remark && (
                            <p className="text-xs text-gray-500 mt-1">{material.remark}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {material.category}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  已选择 <span className="text-primary-600 font-medium">{selectedMaterials.length}</span> 项需补正材料
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="text-primary-500" size={16} />
                  <h3 className="font-medium text-gray-800 text-sm">标准话术模板</h3>
                  <span className="text-xs text-gray-400">
                    点击模板可快速插入补正意见
                  </span>
                </div>
                <div className="space-y-2">
                  {Object.entries(templatesByCategory).map(([category, templates]) => (
                    <div
                      key={category}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div
                        className="flex items-center justify-between px-4 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() =>
                          setExpandedCategory(
                            expandedCategory === category ? null : category
                          )
                        }
                      >
                        <span className="text-sm font-medium text-gray-700">
                          {category}
                        </span>
                        <ChevronRight
                          size={16}
                          className={`text-gray-400 transition-transform ${
                            expandedCategory === category ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                      {expandedCategory === category && (
                        <div className="divide-y divide-gray-100">
                          {templates.map((template) => (
                            <div
                              key={template.id}
                              className="flex items-center justify-between px-4 py-2.5 hover:bg-primary-50/50 cursor-pointer transition-colors group"
                              onClick={() => handleInsertTemplate(template)}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 truncate">
                                  {template.title}
                                </p>
                              </div>
                              <button
                                className="ml-2 opacity-0 group-hover:opacity-100 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-opacity"
                                onClick={(e) => handleCopyTemplate(template, e)}
                              >
                                <Copy size={12} />
                                复制
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-primary-500" size={16} />
                    <h3 className="font-medium text-gray-800 text-sm">补正意见</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <label className="text-sm text-gray-600">补正期限：</label>
                    <input
                      type="date"
                      value={supplementDeadline}
                      onChange={(e) => setSupplementDeadline(e.target.value)}
                      className="input-field w-40 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <textarea
                  value={supplementReason}
                  onChange={(e) => setSupplementReason(e.target.value)}
                  placeholder="请输入补正意见，或从上方选择标准模板..."
                  className="input-field min-h-[160px] resize-none"
                />
                <p className="text-xs text-gray-400 mt-2 text-right">
                  共 {supplementReason.length} 字
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button onClick={handleCancel} className="btn-secondary flex items-center gap-1.5">
                <X size={16} />
                取消
              </button>
              <button onClick={handleSaveDraft} className="btn-secondary flex items-center gap-1.5">
                <Save size={16} />
                保存草稿
              </button>
              <button
                onClick={handleSendNotice}
                disabled={selectedMaterials.length === 0 || !supplementReason.trim()}
                className={`btn-primary flex items-center gap-1.5 ${
                  selectedMaterials.length === 0 || !supplementReason.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <Send size={16} />
                发送补正通知
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-5 flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <FileText size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">请选择待补正办件</p>
              <p className="text-sm mt-2">从左侧列表中选择一条办件查看详情并进行补正处置</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSubmittedTab = () => (
    <div className="flex gap-6 p-6 h-[calc(100vh-176px)]">
      <div className="w-[480px] flex-shrink-0 flex flex-col">
        <div className="card p-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />
              <h2 className="text-base font-semibold text-gray-800">已补交材料列表</h2>
            </div>
            <span className="text-xs text-gray-500">
              共 {submittedCases.length} 条
            </span>
          </div>

          <div className="flex-1 overflow-auto -mx-4 px-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-gray-500 text-xs">
                  <th className="py-2.5 px-2 font-medium">联办单号</th>
                  <th className="py-2.5 px-2 font-medium">申请人</th>
                  <th className="py-2.5 px-2 font-medium">新生儿</th>
                  <th className="py-2.5 px-2 font-medium">补正项数</th>
                  <th className="py-2.5 px-2 font-medium">补正期限</th>
                  <th className="py-2.5 px-2 font-medium">状态</th>
                  <th className="py-2.5 px-2 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submittedCases.map((caseItem) => (
                  <tr
                    key={caseItem.id}
                    className={`cursor-pointer transition-colors ${
                      submittedSelectedCaseId === caseItem.id
                        ? 'bg-primary-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectSubmittedCase(caseItem)}
                  >
                    <td className="py-3 px-2">
                      <span className="text-gray-800 font-medium text-xs">
                        {caseItem.caseNo}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-gray-700">{caseItem.applicant.name}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-gray-700">{caseItem.babyInfo.name}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                        <FileText size={14} />
                        {caseItem.supplements.length}项
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-gray-600 text-xs">
                        {getSupplementDeadlineDisplay(caseItem)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge status={caseItem.status} />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button className="text-primary-600 hover:text-primary-700 text-xs flex items-center gap-0.5 ml-auto">
                        确认
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {submittedCases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      <FileText size={48} className="mx-auto mb-3 opacity-50" />
                      <p>暂无已补交材料的办件</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {submittedSelectedCase ? (
          <div className="card p-5 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <RefreshCw className="text-primary-500" size={20} />
                <h2 className="text-base font-semibold text-gray-800">补交材料确认</h2>
              </div>
              <StatusBadge status={submittedSelectedCase.status} />
            </div>

            <div className="flex-1 overflow-auto space-y-5">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="text-primary-500" size={16} />
                  <h3 className="font-medium text-gray-800 text-sm">办件基本信息</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 flex-shrink-0">联办单号：</span>
                    <span className="text-gray-800 font-medium">{submittedSelectedCase.caseNo}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 flex-shrink-0">叫号编号：</span>
                    <span className="text-gray-800">{submittedSelectedCase.queueNo || '-'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <User size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-500">申请人：</span>
                      <span className="text-gray-800">{submittedSelectedCase.applicant.name}</span>
                      <span className="text-gray-400 ml-2 text-xs">
                        ({submittedSelectedCase.applicant.relation})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 flex-shrink-0">联系电话：</span>
                    <span className="text-gray-800">{submittedSelectedCase.applicant.phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Baby size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-500">新生儿：</span>
                      <span className="text-gray-800">{submittedSelectedCase.babyInfo.name}</span>
                      <span className="text-gray-400 ml-2 text-xs">
                        ({submittedSelectedCase.babyInfo.gender === 'male' ? '男' : '女'})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-500">出生日期：</span>
                      <span className="text-gray-800">{submittedSelectedCase.babyInfo.birthDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="text-primary-500" size={16} />
                  <h3 className="font-medium text-gray-800 text-sm">原始补正材料清单</h3>
                  <span className="text-xs text-gray-400">
                    勾选申请人已补齐的材料
                  </span>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {submittedSelectedCase.supplements.map((supplement, index) => (
                    <div
                      key={supplement.id}
                      onClick={() => handleSupplementToggle(supplement.id)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                        completedSupplements.includes(supplement.id)
                          ? 'bg-green-50/70'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {completedSupplements.includes(supplement.id) ? (
                          <CheckCircle
                            size={18}
                            className="text-green-500 flex-shrink-0"
                          />
                        ) : (
                          <XCircle
                            size={18}
                            className="text-gray-300 flex-shrink-0"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs font-medium">
                              第{index + 1}项
                            </span>
                            <span className="text-gray-800 text-sm font-medium">
                              {supplement.materialName}
                            </span>
                            {completedSupplements.includes(supplement.id) && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-xs rounded">
                                已补齐
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            补正原因：{supplement.reason}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            补正期限：{supplement.deadline}
                          </p>
                        </div>
                      </div>
                      <label className="text-xs text-primary-600 flex items-center gap-1 select-none">
                        <input
                          type="checkbox"
                          checked={completedSupplements.includes(supplement.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSupplementToggle(supplement.id);
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        已补齐
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  已确认 <span className="text-green-600 font-medium">{completedSupplements.length}</span> / {submittedSelectedCase.supplements.length} 项材料已补齐
                </p>
              </div>

              {completedSupplements.length > 0 && completedSupplements.length < submittedSelectedCase.supplements.length && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="text-orange-500" size={16} />
                    <h3 className="font-medium text-gray-800 text-sm">二次补正意见</h3>
                    <span className="text-xs text-gray-400">
                      请说明仍需补正的原因
                    </span>
                  </div>
                  <textarea
                    value={secondSupplementReason}
                    onChange={(e) => setSecondSupplementReason(e.target.value)}
                    placeholder="请输入二次补正意见，说明仍需补正的材料及原因..."
                    className="input-field min-h-[120px] resize-none"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setSubmittedSelectedCaseId(null);
                  setCompletedSupplements([]);
                  setSecondSupplementReason('');
                }}
                className="btn-secondary flex items-center gap-1.5"
              >
                <X size={16} />
                取消
              </button>
              <button
                onClick={handlePartialSupplement}
                disabled={
                  completedSupplements.length === 0 ||
                  completedSupplements.length >= submittedSelectedCase.supplements.length ||
                  !secondSupplementReason.trim()
                }
                className={`btn-secondary border-orange-300 text-orange-600 hover:bg-orange-50 flex items-center gap-1.5 ${
                  completedSupplements.length === 0 ||
                  completedSupplements.length >= submittedSelectedCase.supplements.length ||
                  !secondSupplementReason.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <Send size={16} />
                确认部分补齐，发送二次补正通知
              </button>
              <button
                onClick={handleFullSupplement}
                disabled={completedSupplements.length === 0}
                className={`btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-1.5 ${
                  completedSupplements.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <CheckCircle size={16} />
                确认全部补齐，恢复办理
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-5 flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <CheckCircle size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">请选择已补交材料的办件</p>
              <p className="text-sm mt-2">从左侧列表中选择一条办件进行材料确认并恢复办理</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">补正处置</h1>
            <p className="text-sm text-gray-500 mt-1">
              对申请材料不齐全或不符合法定形式的办件进行补正通知与材料确认
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">当前窗口：</span>
            <span className="px-3 py-1 bg-primary-50 text-primary-600 text-sm font-medium rounded">
              {currentUser.windowNo}号窗口
            </span>
          </div>
        </div>

        <div className="flex gap-1 mt-5 border-b border-gray-200 -mb-5">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'pending'
                ? 'text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              待补正
            </div>
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'submitted'
                ? 'text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              已补交
              {submittedCases.length > 0 && (
                <span className="px-1.5 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full min-w-[20px] text-center">
                  {submittedCases.length}
                </span>
              )}
            </div>
            {activeTab === 'submitted' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t" />
            )}
          </button>
        </div>
      </div>

      {caseNotFound && (
        <div className="mx-6 mt-4 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="text-orange-500 flex-shrink-0" size={18} />
          <span className="text-sm text-orange-700">
            未找到ID为 <span className="font-medium">{id}</span> 的办件，请从左侧列表中选择办件
          </span>
        </div>
      )}

      {activeTab === 'pending' ? renderPendingTab() : renderSubmittedTab()}
    </div>
  );
}
