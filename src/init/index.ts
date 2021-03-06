import './polyfill';
import 'src/style';

import Meetbot from './meetbot';

import { sandBox } from 'src/lib/utils';
import { isArray } from 'src/lib/assert';

// 全局 Meetbot 命名空间声明
declare global {
    interface Window {
        BH: typeof Meetbot;
    }
}

// 初始化入口
Object.defineProperty(window, 'BH', {
    enumerable: false,
    value: {
        ...Meetbot,
        ...(window.BH || {}),
    },
});

function eventify<T>(arr: Array<T>, callback: (arg: T) => void) {
    arr.push = (e) => {
        const num = Array.prototype.push.call(arr, e);
        callback(e);
        return num;
    };
}

// 运行入口函数
setTimeout(() => {
    const bhAsyncInit = window.bhAsyncInit;

    if (isArray(bhAsyncInit)) {
        bhAsyncInit.forEach((cb) => sandBox(cb)());
    }
    else if (bhAsyncInit) {
        sandBox(bhAsyncInit)();
    }
    if (Array.isArray(window.bhAsyncInit)) {
        eventify(window.bhAsyncInit, (item) => {
            sandBox(item)();
        });
    }
});
