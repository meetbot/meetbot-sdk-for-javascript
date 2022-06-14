import chalk from 'chalk';
import webpack from 'webpack';
import baseConfig from './webpack.base';
import TerserPlugin from 'terser-webpack-plugin';
import OSS from 'ali-oss';

import { readdirSync } from 'fs';
import { join } from 'path';
import { resolve, version } from './utils';

const dotenv = require('dotenv');
dotenv.config();

if (!baseConfig.optimization) {
  baseConfig.optimization = {};
}

if (!baseConfig.optimization.minimizer) {
  baseConfig.optimization.minimizer = [];
}

baseConfig.devtool = false;

baseConfig.optimization.minimizer.push(
  new TerserPlugin({
    test: /\.js$/i,
    cache: false,
    terserOptions: {
      ecma: 5,
      ie8: false,
      safari10: false,
      output: {
        comments: /^!/,
      },
    },
  }),
);

baseConfig.performance = {
  hints: false,
  // 大小限制为 80Kb（单位为 bytes）
  maxAssetSize: 80000,
  maxEntrypointSize: 80000,
};

/**
 * 编译文件
 * @param {string} input 入口文件
 * @param {string} output 输出文件
 */
function compile(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 设置入口
    baseConfig.entry = input;
    // 设置输出
    baseConfig.output!.filename = output;
    webpack(baseConfig, (err) => {
      if (err) {
        reject(err);
        console.log(err);
        return;
      }
      console.log(chalk.cyan(`Build complete '${output}'.`));
      resolve();
    });
  });
}

/**
 * 判断oss云端文件是否存在，存在则备份
 * @param client alioss
 * @param name 不包含Bucket名称在内的Object的完整路径，例如example/test.txt
 * @param options 
 */
async function isExistObject(client: OSS, name: string, options = {}) {
  try {
    await client.head(name, options);
    await client.copy(`${name}.backup`, name);
  } catch (error) {
    if (error.code === 'NoSuchKey') {
    }
  }
}

/**
 * 分片上传
 * @param client alioss
 * @param dirName 文件名（例如file.txt）或目录（例如abc/test/file.txt）
 * @param truefile 文件路径
 */
function multipartUpload(client: OSS, dirName: string, truefile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.multipartUpload(dirName, truefile, {}).then((resut: any) => {
      console.log(chalk.cyan(`\nDeploy complete ${dirName}`));
      resolve();
    }).catch((err: any) => {
      console.error(err);
      reject(err);
    });
  })
}

// 主流程
async function main() {
  // if (!process.env.ossKey || !process.env.ossSecret) {
  //   console.log(chalk.cyan('\nossKey or ossSecret is empty.'));
  //   console.log(chalk.cyan('Deploy failed.\n'));
  //   return;
  // }
  // const client = new OSS({
  //   region: 'oss-cn-hongkong',
  //   accessKeyId: process.env.ossKey || '',
  //   accessKeySecret: process.env.ossSecret || '',
  //   bucket: 'meetbot',
  // });
  
  const files: [string, string][] = [[resolve('src/init/index.ts'), join('', `sdk-${version}.js`)]];
  readdirSync(resolve('src/special')).forEach((file) => files.push([
    resolve(`src/special/${file}/index.ts`),
    `${file}.js`,
  ]));
  files.push([resolve('src/special/shopify/order-update.ts'), 'order-update.js']);

  const node_env = process.env.APP_NODE_ENV === 'production' ? 'prod' : 'test';
  
  for (let i = 0; i < files.length; i++) {
    await compile(...files[i]);
    const dirName = `sdk/${node_env}/` + baseConfig.output!.filename;
    const truefile = baseConfig.output!.path + '/' + baseConfig.output!.filename;

    // isExistObject(client, dirName);

    // await multipartUpload(client, dirName, truefile);
  }
  console.log(chalk.cyan('\nDeploy complete.\n'));
}

console.log('\x1Bc');
main();
