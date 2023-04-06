# upload_timeline
## USAGE
```node
npm install upload-timeline
```
```javascript
import { UploadTimeline } from "upload-timeline";
let doc = document.getElementById("uploadTimeline");
let uploadTimeline = new UploadTimeline(doc, [
    {
        groupName: "组名称1",
        uploadHistory: [
            { uploadTime: new Date("2022/09/01 22:00"), filePath: "文件路径" },
            { uploadTime: new Date("2023/04/01 12:00"), filePath: "文件路径" },
        ],
    },
    {
        groupName: "组名称2",
        uploadHistory: [
            { uploadTime: new Date("2021/05/01 22:00"), filePath: "文件路径" },
            { uploadTime: new Date("2023/02/01 12:00"), filePath: "文件路径" },
        ],
    },
])
```