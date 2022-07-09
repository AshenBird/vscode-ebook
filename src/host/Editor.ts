import {
  CancellationToken,
  CustomReadonlyEditorProvider,
  CustomDocument,
  CustomDocumentOpenContext,
  WebviewPanel,
  window,
  workspace,
  Uri,
  Disposable,
  Webview,
  ExtensionContext,
} from "vscode";
import * as path from "path";
import { StringDecoder } from "string_decoder";
import { Buffer } from "buffer";
interface Message {
  type: "ready" ;
  content: unknown[];
}
function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
function arr2str(arr: Uint8Array) {
  const decoder = new StringDecoder();
  return decoder.end(Buffer.from(arr));
}

interface DocStore {
  content: Uint8Array|null;
  lock: boolean;
}


export interface EpubDocument extends CustomDocument{
  content:Uint8Array
}

export class EpubEditorProvider implements CustomReadonlyEditorProvider {
  // 注册函数
  static register(instance: EpubEditorProvider) {
    return window.registerCustomEditorProvider(`mcswift.epub`, instance, {
      webviewOptions: {
        retainContextWhenHidden: true,
        enableFindWidget: true,
      },
    });
  }

  // 大致分为两个部分，编辑器实例部分，和视图层 resolve 部分

  // 编辑器实例
  template: string = ""; // 模板数据
  private disposables: Disposable[] = [];
  private storage = new Map<unknown, DocStore>();
  /**
   * @constructor
   * @param type
   */
  constructor(public readonly type: string) {}
  public register(context:ExtensionContext) {
    const disposable = EpubEditorProvider.register(this);
    this.disposables.push(disposable);
    context.subscriptions.push(this);
    return this;
  }

  public dispose() {
    for (const item of this.disposables) {
      item.dispose();
    }
  }

  async openCustomDocument(uri: Uri, openContext: CustomDocumentOpenContext, token: CancellationToken){
    const arr = await workspace.fs.readFile(uri);
    return {
      content:arr,
      uri,
      dispose:()=>{}
    };
  }
  // resolve 视图
  public async resolveCustomEditor(
    document: EpubDocument,
    webviewPanel: WebviewPanel,
    token: CancellationToken
  ) {
    const uri = document.uri.toString();
    if (!this.storage.has(uri)) {
      this.storage.set(uri, {
        content: null,
        lock: false,
      });
    }

    webviewPanel.webview.options = {
      enableScripts: true,
    };

    this.listen(document, webviewPanel);

    webviewPanel.webview.html = await this.createHTML(document, webviewPanel);
  }
  /**
   * 创建 html 文件
   * @param document
   * @returns
   */
  private async createHTML(document: EpubDocument, webviewPanel: WebviewPanel) {
    if (!this.template) {
      const templatePath = path.resolve(
        __dirname,
        `../client/epub/index.html`
      );
      const templateUri = Uri.file(templatePath);
      const arr = await workspace.fs.readFile(templateUri);
      this.template = arr2str(arr);
    }
    const assetsPath = webviewPanel.webview.asWebviewUri(
      Uri.file(path.resolve(__dirname, `../client/epub`))
    );
    const nonce = getNonce();
    const result = this.template
      .replace("{{base}}", assetsPath + "/")
      .replace(new RegExp("{{cspSource}}", "g"), webviewPanel.webview.cspSource)
      .replace(new RegExp("{{nonce}}", "g"), nonce);
    return result;
  }

  /**
   *
   * @param document
   * @param webviewPanel
   */
  private listen(
    document: EpubDocument,
    webviewPanel: WebviewPanel,
  ) {
    const uri = document.uri.toString();
    const store = this.storage.get(uri) as DocStore;

    // 监听 webview
    webviewPanel.webview.onDidReceiveMessage(({ type, content }: Message) => {
      const actions = {
        ready: () => {
          store.lock = false;
          store.content = null;
          this.sendContent(document, webviewPanel.webview);
          this.sendConfig(document, webviewPanel.webview);
          return;
        },
      };
      actions[type]();
    });


    // 主题改变的监听
    const themeChangeSub = window.onDidChangeActiveColorTheme(() => {
      webviewPanel.webview.postMessage({
        type: "restart",
      });
    });
    // dispose 监听
    webviewPanel.onDidDispose(() => {
      themeChangeSub.dispose();
    });
  }

  /**
   * 发送配置
   * @param document
   * @param webview
   */
  private sendConfig(document: EpubDocument, webview: Webview) {
    const config = {
      theme: {
        1: "light",
        2: "dark",
        3: "highContrast", //HighContrast
        4: ""
      }[window.activeColorTheme.kind],
      uri: document.uri.toString(),
      mode: "edit",
    };
    webview.postMessage({
      type: "config",
      content: config,
    });
  }

  /**
   * 发送内容
   * @param document
   * @param webview
   * @returns
   */
  private sendContent(document: EpubDocument, webview: Webview) {
    const uri = webview.asWebviewUri(document.uri).toString();
    webview.postMessage({
      type: "change",
      uri,
    });
  }
}
