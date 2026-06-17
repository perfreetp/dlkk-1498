import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Baby,
  User,
  CreditCard,
  ShieldCheck,
  Archive,
  AlertTriangle,
} from 'lucide-react';
import { useCaseStore } from '@/store/useCaseStore';
import { StatusBadge } from '@/components/business/StatusBadge';
import { Timeline } from '@/components/business/Timeline';
import type { CaseStatus, ConsistencyCheckResult, ItemProgressStatus } from '@/types';

const actionConfig: Record<string, { label: string; path: string; icon: any }> = {
  pending: { label: '继续办理', path: '/create', icon: Edit },
  verifying: { label: '继续办理', path: '/create', icon: Edit },
  arranging: { label: '联办编排', path: '/arrange', icon: FileText },
  processing: { label: '查看进度', path: '/progress', icon: Clock },
  supplement: { label: '补正处置', path: '/supplement', icon: AlertTriangle },
  exception: { label: '异常退回', path: '/exception', icon: AlertCircle },
  completed: { label: '办结归档', path: '/archive', icon: Archive },
  archived: { label: '办结归档', path: '/archive', icon: Archive },
};

const itemProgressConfig: Record<ItemProgressStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待办理', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  processing: { label: '办理中', color: 'text-primary-600', bgColor: 'bg-primary-50' },
  completed: { label: '已完成', color: 'text-success', bgColor: 'bg-green-50' },
  overdue: { label: '已逾期', color: 'text-danger', bgColor: 'bg-red-50' },
  exception: { label: '异常', color: 'text-warning', bgColor: 'bg-orange-50' },
};

const consistencyConfig: Record<ConsistencyCheckResult, { label: string; color: string; icon: any }> = {
  passed: { label: '比对通过', color: 'text-success', icon: CheckCircle },
  failed: { label: '比对不通过', color: 'text-danger', icon: XCircle },
  pending: { label: '待核验', color: 'text-warning', icon: Clock },
};

export default function CaseDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getCaseById, setCurrentCase, currentUser } = useCaseStore();

  const caseInfo = id ? getCaseById(id) : undefined;

  useEffect(() => {
    if (caseInfo) {
      setCurrentCase(caseInfo);
    }
  }, [caseInfo, setCurrentCase]);

  if (!caseInfo) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">办件不存在或已被删除</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
        >
          返回工作台
        </button>
      </div>
    );
  }

  const action = actionConfig[caseInfo.status as CaseStatus];
  const ActionIcon = action?.icon || Edit;

  const groupedMaterials = caseInfo.materials.reduce((acc, material) => {
    if (!acc[material.category]) {
      acc[material.category] = [];
    }
    acc[material.category].push(material);
    return acc;
  }, {} as Record<string, typeof caseInfo.materials>);

  const consistency = consistencyConfig[caseInfo.parents.consistencyCheck];
  const ConsistencyIcon = consistency.icon;

  const selectedItems = caseInfo.selectedItems.filter((item) => item.selected);

  const formatGender = (gender: string) => (gender === 'male' ? '男' : '女');

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft size={16} />
            返回
          </button>
          <span>/</span>
          <span>办件详情</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-800">{caseInfo.caseNo}</h1>
                <StatusBadge status={caseInfo.status} />
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  受理时间：{caseInfo.createdAt}
                </span>
                {caseInfo.windowNo && (
                  <span>受理窗口：{caseInfo.windowNo}号窗</span>
                )}
                {caseInfo.handler && (
                  <span>经办人：{caseInfo.handler}</span>
                )}
              </div>
            </div>
          </div>

          {action && (
            <button
              onClick={() => navigate(`${action.path}/${caseInfo.id}`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              <ActionIcon size={18} />
              {action.label}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <User size={20} className="text-primary-500" />
                基本信息
              </h2>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  申请人信息
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 bg-gray-50 rounded-lg p-4">
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-24 flex-shrink-0">姓名</span>
                    <span className="text-sm text-gray-800 font-medium">{caseInfo.applicant.name}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-24 flex-shrink-0">身份证号</span>
                    <span className="text-sm text-gray-800 font-medium">{caseInfo.applicant.idCard}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-24 flex-shrink-0">联系电话</span>
                    <span className="text-sm text-gray-800 font-medium">{caseInfo.applicant.phone}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-24 flex-shrink-0">与新生儿关系</span>
                    <span className="text-sm text-gray-800 font-medium">{caseInfo.applicant.relation}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Baby size={16} className="text-gray-400" />
                  新生儿信息
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 bg-gray-50 rounded-lg p-4">
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-32 flex-shrink-0">姓名</span>
                    <span className="text-sm text-gray-800 font-medium">{caseInfo.babyInfo.name}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-32 flex-shrink-0">性别</span>
                    <span className="text-sm text-gray-800 font-medium">{formatGender(caseInfo.babyInfo.gender)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-32 flex-shrink-0">出生日期</span>
                    <span className="text-sm text-gray-800 font-medium">{caseInfo.babyInfo.birthDate}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-32 flex-shrink-0">出生医学证明编号</span>
                    <span className="text-sm text-gray-800 font-medium">{caseInfo.babyInfo.birthCertificateNo}</span>
                  </div>
                  <div className="flex col-span-2">
                    <span className="text-sm text-gray-500 w-32 flex-shrink-0">出生地点</span>
                    <span className="text-sm text-gray-800 font-medium">{caseInfo.babyInfo.birthPlace}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <CreditCard size={16} className="text-gray-400" />
                  父母信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">父亲</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">姓名</span>
                        <span className="text-sm text-gray-800">{caseInfo.parents.father.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">身份证号</span>
                        <span className="text-sm text-gray-800">{caseInfo.parents.father.idCard}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">核验状态</span>
                        {caseInfo.parents.father.idCardVerified ? (
                          <span className="flex items-center gap-1 text-sm text-success">
                            <CheckCircle size={14} />
                            已核验
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-gray-400">
                            <Clock size={14} />
                            待核验
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">母亲</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">姓名</span>
                        <span className="text-sm text-gray-800">{caseInfo.parents.mother.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">身份证号</span>
                        <span className="text-sm text-gray-800">{caseInfo.parents.mother.idCard}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">核验状态</span>
                        {caseInfo.parents.mother.idCardVerified ? (
                          <span className="flex items-center gap-1 text-sm text-success">
                            <CheckCircle size={14} />
                            已核验
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-gray-400">
                            <Clock size={14} />
                            待核验
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={22} className={consistency.color} />
                    <div>
                      <div className="text-sm font-medium text-gray-800">证件一致性比对</div>
                      <div className="text-xs text-gray-500 mt-0.5">父母身份证件与出生医学证明信息一致性校验</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ConsistencyIcon size={18} className={consistency.color} />
                    <span className={`text-sm font-medium ${consistency.color}`}>
                      {consistency.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <FileText size={20} className="text-primary-500" />
                材料清单
              </h2>

              <div className="space-y-5">
                {Object.entries(groupedMaterials).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">{category}</h3>
                    <div className="space-y-2">
                      {items.map((material) => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-3 rounded-md bg-gray-50 border border-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            {material.provided ? (
                              <CheckCircle size={18} className="text-success flex-shrink-0" />
                            ) : (
                              <XCircle size={18} className="text-danger flex-shrink-0" />
                            )}
                            <span className="text-sm text-gray-800">{material.name}</span>
                            {material.required && (
                              <span className="text-xs px-1.5 py-0.5 bg-red-50 text-danger rounded">
                                必填
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {material.remark && (
                              <span className="text-xs text-gray-400">{material.remark}</span>
                            )}
                            <span className={`text-sm ${material.provided ? 'text-success' : 'text-gray-400'}`}>
                              {material.provided ? '已提供' : '未提供'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <FileText size={20} className="text-primary-500" />
                联办事项
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">事项名称</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">办理部门</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">适用场景</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">办理时限</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">费用</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">进度状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedItems.map((item) => {
                      const progress = item.progressStatus || 'pending';
                      const progressCfg = itemProgressConfig[progress];
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-800 font-medium">{item.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{item.department}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{item.scenario}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{item.handlingTime}个工作日</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">
                              {item.fee ? `¥${item.fee}` : '免费'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${progressCfg.bgColor} ${progressCfg.color}`}>
                              {progressCfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-card p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <Clock size={20} className="text-primary-500" />
                办件流向
              </h2>
              <Timeline records={caseInfo.flowRecords} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          返回工作台
        </button>
        {action && (
          <button
            onClick={() => navigate(`${action.path}/${caseInfo.id}`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            <ActionIcon size={18} />
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
