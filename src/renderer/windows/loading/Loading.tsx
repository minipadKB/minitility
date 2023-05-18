/* eslint-disable react/self-closing-comp */
/* eslint-disable prettier/prettier */
import './Loading.css';

export default function Loading() {
  return (
    <>
      <div className='w-full h-full '>
        <div className="w-[120px] h-[120px] rounded-full border-[#8848A2]" style="border: 3px"></div>
        <div className=""> </div>
        <div className=""> </div>
      </div>
      <div id="">Loading available devices...</div>
    </>
  );
}
