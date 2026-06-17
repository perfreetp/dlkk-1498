import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCaseStore } from '@/store/useCaseStore';
import { Steps } from '@/components/business/Steps';
import type { CaseInfo, SelectedItem, FlowRecord } from '@/types';
import { mockAvailableItems } from '@/mock/cases';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  User,
  Baby,
  UserPlus,
  ShieldCheck,
  FileText,
  Save,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import type {
  CaseType,
  ApplicantInfo,
  BabyInfo,
  ParentsInfo,
  MaterialItem,
  ConsistencyCheckResult,
} from '@/types';

const steps = [
  { title: '叫号接件' },
  { title: '信息核验' },
  { title: '联办编排' },
  { title: '受理提交' },
];

const applicantTypes: { type: CaseType; label: string; description: string; icon: typeof User | typeof Baby | typeof UserPlus }[] = [
  { type: 'newborn', label: '新生儿', description: '由新生儿本人办理', icon: Baby },
  { type: 'parents', label: '父母代办', description: '由父亲或母亲代办', icon: User },
  { type: 'other', label: '其他代办', description: '其他亲属或委托人代办', icon: UserPlus },
];

const defaultMaterials: MaterialItem[] = [
  { id: 'm1', name: '出生医学证明', required: true, provided: false, category: '基础材料' },
  { id: 'm2', name: '父母双方身份证', required: true, provided: false, category: '基础材料' },
  { id: 'm3', name: '父母双方户口簿', required: true, provided: false, category: '基础材料' },
  { id: 'm4', name: '结婚证', required: true, provided: false, category: '基础材料' },
  { id: 'm5', name: '生育服务证', required: false, provided: false, category: '补充材料' },
  { id: 'm6', name: '房产证/居住证明', required: false, provided: false, category: '补充材料' },
];

function generateCaseNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `CS${y}${m}${d}${rand}`;
}

function getNowStr() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

export default function CreateCase() {
  const navigate = useNavigate();
  const { id: editingId } = useParams();
  const { addCase, updateCase, setCurrentCase, getCaseById, currentUser, addFlowRecord } = useCaseStore();

  const existingCase = editingId ? getCaseById(editingId) : null;

  const [caseType, setCaseType] = useState<CaseType>(existingCase?.type || 'newborn');
  const [applicant, setApplicant] = useState<ApplicantInfo>(
    existingCase?.applicant || {
      name: '',
      idCard: '',
      phone: '',
      relation: '本人',
    }
  );
  const [babyInfo, setBabyInfo] = useState<BabyInfo>(
    existingCase?.babyInfo || {
      name: '',
      gender: 'male',
      birthDate: '',
      birthCertificateNo: '',
      birthPlace: '',
    }
  );
  const [parents, setParents] = useState<ParentsInfo>(
    existingCase?.parents || {
      father: {
        name: '',
        idCard: '',
        idCardVerified: false,
      },
      mother: {
        name: '',
        idCard: '',
        idCardVerified: false,
      },
      consistencyCheck: 'pending',
    }
  );
  const [materials, setMaterials] = useState<MaterialItem[]>(existingCase?.materials || defaultMaterials);

  useEffect(() => {
    if (editingId) {
      const c = getCaseById(editingId);
      if (c) {
        setCurrentCase(c);
      }
    }
  }, [editingId, getCaseById, setCurrentCase]);

  const handleReadIdCard = (parent: 'father' | 'mother') => {
    const mockNames = { father: '张伟', mother: '李娜' };
    const mockIdCards = {
      father: '310101199001011234',
      mother: '310102199203045678',
    };

    setParents((prev) => {
      const updated = {
        ...prev,
        [parent]: {
          ...prev[parent],
          name: mockNames[parent],
          idCard: mockIdCards[parent],
          idCardVerified: true,
        },
      };

      updated.consistencyCheck =
        updated.father.idCardVerified && updated.mother.idCardVerified
          ? 'passed'
          : 'pending';

      return updated;
    });
  };

  const toggleMaterial = (id: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, provided: !m.provided } : m))
    );
  };

  const getConsistencyStatus = (result: ConsistencyCheckResult) => {
    switch (result) {
      case 'passed':
        return {
          label: '比对通过',
          icon: CheckCircle,
          color: 'text-success',
          bgColor: 'bg-green-50',
        };
      case 'failed':
        return {
          label: '比对不通过',
          icon: XCircle,
          color: 'text-danger',
          bgColor: 'bg-red-50',
        };
      default:
        return {
          label: '待核验',
          icon: Clock,
          color: 'text-warning',
          bgColor: 'bg-orange-50',
        };
    }
  };

  const groupedMaterials = materials.reduce((acc, material) => {
    if (!acc[material.category]) {
      acc[material.category] = [];
    }
    acc[material.category].push(material);
    return acc;
  }, {} as Record<string, MaterialItem[]>);

  const buildCaseBase = (): Partial<CaseInfo> => {
    const now = getNowStr();
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    return {
      type: caseType,
      applicant,
      babyInfo,
      parents,
      materials,
      selectedItems: existingCase?.selectedItems || mockAvailableItems.map((i) => ({ ...i })),
      supplements: existingCase?.supplements || [],
      exceptions: existingCase?.exceptions || [],
      flowRecords: existingCase?.flowRecords || [],
      results: existingCase?.results || {
        paper: { type: 'paper', registered: false },
        electronic: { type: 'electronic', registered: false },
      },
      updatedAt: now,
      deadline: deadline.toISOString().split('T')[0],
      windowNo: currentUser.windowNo,
      handler: currentUser.name,
      queueNo: existingCase?.queueNo,
    };
  };

  const handlePrev = () => {
    navigate('/dashboard');
  };

  const handleSaveDraft = () => {
    const base = buildCaseBase();
    const now = getNowStr();

    if (existingCase) {
      updateCase(existingCase.id, {
        ...base,
        status: 'verifying',
      });
      addFlowRecord(existingCase.id, {
        status: 'verifying',
        operator: currentUser.name,
        department: currentUser.department,
        action: '保存草稿',
      });
      setCurrentCase({ ...existingCase, ...base, status: 'verifying' } as CaseInfo);
      alert('草稿已保存');
    } else {
      const caseId = `case-${Date.now()}`;
      const caseNo = generateCaseNo();
      const newCase: CaseInfo = {
        id: caseId,
        caseNo,
        status: 'verifying',
        ...base,
        createdAt: now,
        updatedAt: now,
        flowRecords: [
          {
            id: `f-${Date.now()}`,
            status: 'verifying',
            operator: currentUser.name,
            department: currentUser.department,
            action: '新建草稿',
            timestamp: now,
          },
        ],
      } as CaseInfo;
      addCase(newCase);
      setCurrentCase(newCase);
      alert('草稿已保存');
    }
  };

  const handleNext = () => {
    if (!applicant.name || !babyInfo.name) {
      alert('请至少填写申请人姓名和新生儿姓名');
      return;
    }
    const base = buildCaseBase();
    const now = getNowStr();

    let targetId: string;
    let targetNo: string;

    if (existingCase) {
      targetId = existingCase.id;
      targetNo = existingCase.caseNo;
      updateCase(existingCase.id, {
        ...base,
        status: 'arranging',
      });
      addFlowRecord(existingCase.id, {
        status: 'arranging',
        operator: currentUser.name,
        department: currentUser.department,
        action: '信息核验通过，进入联办编排',
      });
    } else {
      targetId = `case-${Date.now()}`;
      targetNo = generateCaseNo();
      const newCase: CaseInfo = {
        id: targetId,
        caseNo: targetNo,
        status: 'arranging',
        ...base,
        createdAt: now,
        updatedAt: now,
        flowRecords: [
          {
            id: `f-${Date.now()}`,
            status: 'pending',
            operator: '叫号系统',
            department: '政务中心',
            action: '叫号',
            timestamp: now,
          },
          {
            id: `f-${Date.now() + 1}`,
            status: 'verifying',
            operator: currentUser.name,
            department: currentUser.department,
            action: '信息核验',
            timestamp: now,
          },
          {
            id: `f-${Date.now() + 2}`,
            status: 'arranging',
            operator: currentUser.name,
            department: currentUser.department,
            action: '进入联办编排',
            timestamp: now,
          },
        ],
      } as CaseInfo;
      addCase(newCase);
      setCurrentCase(newCase);
    }

    navigate(`/arrange/${targetId}`);
  };

  const consistencyStatus = getConsistencyStatus(parents.consistencyCheck);
  const ConsistencyIcon = consistencyStatus.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800">新建联办单</h1>
            <span className="text-sm text-gray-500">窗口：01号窗</span>
          </div>
          <div className="flex justify-center">
            <Steps steps={steps} current={1} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User size={20} className="text-primary-500" />
            办事人类型
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {applicantTypes.map((item) => {
              const Icon = item.icon;
              const isActive = caseType === item.type;
              return (
                <div
                  key={item.type}
                  onClick={() => setCaseType(item.type)}
                  className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${
                    isActive
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                        isActive ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Icon size={24} />
                    </div>
                    <div
                      className={`font-medium ${
                        isActive ? 'text-primary-600' : 'text-gray-700'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User size={20} className="text-primary-500" />
            申请人信息
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={applicant.name}
                onChange={(e) => setApplicant({ ...applicant, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                身份证号 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={applicant.idCard}
                onChange={(e) => setApplicant({ ...applicant, idCard: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入身份证号"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系电话 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={applicant.phone}
                onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入联系电话"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
              与新生儿关系 <span className="text-danger">*</span>
            </label>
              <select
                value={applicant.relation}
                onChange={(e) => setApplicant({ ...applicant, relation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="本人">本人</option>
                <option value="父亲">父亲</option>
                <option value="母亲">母亲</option>
                <option value="祖父">祖父</option>
                <option value="祖母">祖母</option>
                <option value="外祖父">外祖父</option>
                <option value="外祖母">外祖母</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Baby size={20} className="text-primary-500" />
            新生儿信息
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={babyInfo.name}
                onChange={(e) => setBabyInfo({ ...babyInfo, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入新生儿姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                性别 <span className="text-danger">*</span>
              </label>
              <div className="flex gap-4">
                <label
                  className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={babyInfo.gender === 'male'}
                    onChange={() => setBabyInfo({ ...babyInfo, gender: 'male' })}
                    className="w-4 h-4 text-primary-500"
                  />
                  <span className="text-gray-700">男</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={babyInfo.gender === 'female'}
                    onChange={() => setBabyInfo({ ...babyInfo, gender: 'female' })}
                    className="w-4 h-4 text-primary-500"
                  />
                  <span className="text-gray-700">女</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                出生日期 <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={babyInfo.birthDate}
                onChange={(e) => setBabyInfo({ ...babyInfo, birthDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                出生医学证明编号 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={babyInfo.birthCertificateNo}
                onChange={(e) => setBabyInfo({ ...babyInfo, birthCertificateNo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入出生医学证明编号"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                出生地点 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={babyInfo.birthPlace}
                onChange={(e) => setBabyInfo({ ...babyInfo, birthPlace: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入出生地点"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard size={20} className="text-primary-500" />
            父母证件核验
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-700">父亲信息</h3>
                <button
                  onClick={() => handleReadIdCard('father')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 transition-colors"
                >
                  <CreditCard size={16} />
                  读取身份证
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">姓名</span>
                  <span className={`text-sm ${parents.father.name ? 'text-gray-800' : 'text-gray-400'}`}>
                    {parents.father.name || '未读取'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">身份证号</span>
                  <span className={`text-sm ${parents.father.idCard ? 'text-gray-800' : 'text-gray-400'}`}>
                    {parents.father.idCard || '未读取'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">核验状态</span>
                  {parents.father.idCardVerified ? (
                    <span className="flex items-center gap-1 text-sm text-success">
                      <CheckCircle size={16} />
                      已核验
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                      <Clock size={16} />
                      待核验
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-700">母亲信息</h3>
                <button
                  onClick={() => handleReadIdCard('mother')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 transition-colors"
                >
                  <CreditCard size={16} />
                  读取身份证
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">姓名</span>
                  <span className={`text-sm ${parents.mother.name ? 'text-gray-800' : 'text-gray-400'}`}>
                    {parents.mother.name || '未读取'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">身份证号</span>
                  <span className={`text-sm ${parents.mother.idCard ? 'text-gray-800' : 'text-gray-400'}`}>
                    {parents.mother.idCard || '未读取'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">核验状态</span>
                  {parents.mother.idCardVerified ? (
                    <span className="flex items-center gap-1 text-sm text-success">
                      <CheckCircle size={16} />
                      已核验
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                      <Clock size={16} />
                      待核验
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-4 p-4 rounded-lg flex items-center justify-between ${consistencyStatus.bgColor}`}>
            <div className="flex items-center gap-3">
              <ShieldCheck size={24} className={consistencyStatus.color} />
              <div>
                <div className={`font-medium ${consistencyStatus.color}`}>父母证件一致性比对</div>
                <div className="text-sm text-gray-500">比对父母身份证件与出生医学证明信息一致性校验</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ConsistencyIcon size={20} className={consistencyStatus.color} />
              <span className={`font-medium ${consistencyStatus.color}`}>
                {consistencyStatus.label}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary-500" />
            材料清单校验
          </h2>
          <div className="space-y-6">
            {Object.entries(groupedMaterials).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-gray-700 mb-3">{category}</h3>
                <div className="space-y-2">
                  {items.map((material) => {
                const isMissing = material.required && !material.provided;
                return (
                  <div
                    key={material.id}
                    className={`flex items-center justify-between p-3 rounded-md border transition-colors ${
                      isMissing
                        ? 'border-danger bg-red-50'
                        : material.provided
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={material.provided}
                        onChange={() => toggleMaterial(material.id)}
                        className="w-4 h-4 text-primary-500 rounded"
                      />
                      <span className={isMissing ? 'text-danger font-medium' : 'text-gray-700'}>
                        {material.name}
                      </span>
                      {material.required && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-danger rounded">
                          必填
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {material.provided ? (
                        <span className="flex items-center gap-1 text-sm text-success">
                          <CheckCircle size={16} />
                          已提供
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-gray-400">
                          <XCircle size={16} />
                          未提供
                        </span>
                      )}
                      <button className="p-1.5 text-gray-400 hover:text-primary-500 transition-colors">
                        <Upload size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 pb-6">
          <button
            onClick={handlePrev}
            className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} />
            上一步
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-6 py-2.5 border border-primary-500 text-primary-500 rounded-md hover:bg-primary-50 transition-colors"
            >
              <Save size={18} />
              保存草稿
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              下一步
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
