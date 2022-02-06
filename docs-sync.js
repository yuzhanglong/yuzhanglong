const lark = require('@larksuiteoapi/allcore');

const USER_ACCESS_TOKEN = '';
const TMP_FOLDER_KEY = ''
const appSettings = lark.newInternalAppSettings({
  appID: '', appSecret: ''
});


const appConfig = lark.newConfig(lark.Domain.FeiShu, appSettings, {
  loggerLevel: lark.LoggerLevel.ERROR, logger: new lark.ConsoleLogger(), store: new lark.DefaultStore(),
});


function getFolderChildrenRequest(folderToken) {
  const req = lark.api.newRequest("/drive/explorer/v2/folder/:folderToken/children", "GET", lark.api.AccessTokenType.Tenant, null);
  req.setPathParams({folderToken});
  return req;
}

function getDocContentRequest(docToken) {
  const req = lark.api.newRequest("/doc/v2/:docToken/content", "GET", lark.api.AccessTokenType.Tenant, null);
  req.setPathParams({docToken});
  return req;
}

function createDocsRequest(folderToken, docContent) {
  return lark.api.newRequest("/doc/v2/create", "POST", lark.api.AccessTokenType.Tenant, {
    FolderToken: folderToken, Content: docContent
  });
}

function deleteDocsRequest(docsToken) {
  const req = lark.api.newRequest(`/drive/explorer/v2/file/docs/${docsToken}`, "DELETE", lark.api.AccessTokenType.User, null);
  req.setUserAccessToken(USER_ACCESS_TOKEN);
  return req;
}

function copyDocsRequest(name, docsToken, folderToken) {
  const req = lark.api.newRequest(`/drive/explorer/v2/file/copy/files/${docsToken}`, "POST", lark.api.AccessTokenType.User, {
    "type": "doc", "dstFolderToken": folderToken, "dstName": name, "commentNeeded": true
  });
  req.setUserAccessToken(USER_ACCESS_TOKEN);
  return req;
}

function createFolderRequest(rootToken, title) {
  const req = lark.api.newRequest(`/explorer/v2/folder/${rootToken}`, "POST", lark.api.AccessTokenType.User, {
    title: title
  });
  req.setUserAccessToken(USER_ACCESS_TOKEN);
  return req;
}

const getFolderChildren = (token) => {
  return lark.api.sendRequest(appConfig, getFolderChildrenRequest(token));
}

const createFolder = (rootToken, title) => {
  return lark.api.sendRequest(appConfig, createFolderRequest(rootToken, title));

}
const copyDocs = (name, docsToken, folderToken) => {
  return lark.api.sendRequest(appConfig, copyDocsRequest(name, docsToken, folderToken));
}

const deleteDocs = (token) => {
  return lark.api.sendRequest(appConfig, deleteDocsRequest(token));
}

const getWikiDocsTree = async (rootFolderToken) => {
  const children = [];

  const res = await getFolderChildren(rootFolderToken);
  const childNodes = Object.keys(res.data.children);
  if (childNodes.length > 0) {
    for (let childNode of childNodes) {
      const nodeInfo = res.data.children[childNode];
      const childNodeInfo = await getWikiDocsTree(childNode);
      children.push({
        children: childNodeInfo, ...nodeInfo
      });
    }
  }
  return children;
}

const deleteDir = async (dirToken) => {
  // 获得当前目录
  const {data} = await getFolderChildren(dirToken);
  for (let key of Object.keys(data.children)) {
    const {token} = data.children[key];
    // 调用删除 API
    await deleteDocs(token);
  }
  console.log('delete successfully!');
}

const runApp = async () => {
  // 获得文档树
  console.log('获取文档树中...');
  const allWikiTree = await getWikiDocsTree('');
  const needCopyDocs = [];

  const travelNode = (nodes) => {
    for (let nodeElement of nodes) {
      if (nodeElement.children.length === 0) {
        if (nodeElement.type === 'doc') {
          needCopyDocs.push(nodeElement);
        }
      } else {
        travelNode(nodeElement.children);
      }
    }
  }
  travelNode(allWikiTree);

  // 清空临时文件夹
  await deleteDir(TMP_FOLDER_KEY);

  for (const {name, token} of needCopyDocs) {
    // 复制文档到目标文件夹中
    const res = await copyDocs(name, token, TMP_FOLDER_KEY);
    console.log(res);
  }
}

runApp()
  .catch(e => {
    console.log(e);
  });
