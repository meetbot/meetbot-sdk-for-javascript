import {
    setCustomUserId,
    getCustomUserId,
    changeCustomUserId,
} from './meetbot';

export * from './meetbot';
export * from './facebook';

// 默认导出为对外暴露的接口
export default {
    setCustomUserId,
    getCustomUserId,
    changeCustomUserId,
};
