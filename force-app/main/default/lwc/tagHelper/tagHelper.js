//spell check out status
const spellCheck =(term)=>{
    return   term.startsWith('sou') && term != 'southern stock' ? 'southern stock' :
             term.startsWith('l') && term != 'limited' ? 'limited' :
             term.startsWith('c') && term != 'close-out' ? 'close-out' :
             term.startsWith('e') && term != 'exempt' ? 'exempt' :
             term.startsWith('s') && term != 'stock' ? 'stock' :
             term
}

const quickSearchString = (term, stock)=>{
    let searchString = 'FIND \''+term+'\' IN ALL FIELDS RETURNING Tag__c(id, Tag_Description__c, Search_Slug_2__c,'
                              +' Product__c, Product_Name__c, ATS_Score__c, Stock_Status__c where product__r.IsActive = true';
    
    stock != null ? searchString += ' and Stock_Status__c  = \''+stock+'\' order by ATS_Score__c desc nulls last)' :searchString += ' order by ATS_Score__c desc nulls last)'; 
    return searchString; 
  }

  const cpqSearchString = (term, stock) =>{
    let status = 'Active'
    let searchString = 'FIND \''+term+'\' IN ALL FIELDS RETURNING Tag__c(id, Tag_Description__c, Search_Slug_2__c, '
    +'Product__c, Product_Name__c, Product__r.Temp_Unavailable__c,Product__r.Temp_Mess__c, ATS_Score__c, Stock_Status__c, '
    +'W_Focus_Product__c, W_Product_Profitability__c, W_Program_Score__c, W_Inventory_Score__c, '
    +'Floor_Price__c, Product__r.Total_Product_Items__c,Product__r.Floor_Type__c, Product_Code__c where product__r.IsActive = true'// and Tag_Status__c = \''+ status+'\''
  
  stock != null ? searchString += ' and Stock_Status__c  = \''+stock+'\' order by ATS_Score__c desc nulls last)' :searchString += ' order by ATS_Score__c desc nulls last)'; 
  //console.log(searchString);
  
  return searchString; 
  }

  const cpqSearchStringMobile = (term, stock) =>{
    let status = 'Active'
    let searchString = 'FIND \''+term+'\' IN ALL FIELDS RETURNING Tag__c(id, Tag_Description__c, Search_Slug_2__c, '
    +'Product__c, Product_Name__c, Product__r.Temp_Unavailable__c,Product__r.Temp_Mess__c, ATS_Score__c, Stock_Status__c, '
    +'W_Focus_Product__c, W_Product_Profitability__c, W_Program_Score__c, W_Inventory_Score__c, Product__r.Agency_Pricing__c, '
    +'Product__r.Ship_Weight__c, Product__r.Pallet_Qty__c, Product__r.SGN__c, Product__r.RUP__c, '
    +'Floor_Price__c, Product__r.Total_Product_Items__c,Product__r.Floor_Type__c, Product_Code__c where product__r.IsActive = true'// and Tag_Status__c = \''+ status+'\''
  
  stock != null ? searchString += ' and Stock_Status__c  = \''+stock+'\' order by ATS_Score__c desc nulls last)' :searchString += ' order by ATS_Score__c desc nulls last)'; 
  return searchString; 
  }
const uniqVals = (arr, track = new Set())=>{
  
  return  arr.filter(({Product__c})=>track.has(Product__c)? false: track.add(Product__c))
 
}

const uniqPromo = (arr, track = new Map())=>{
  return arr.filter(({Search_Label__c})=>track.has(Search_Label__c)? false : track.set(Search_Label__c))
}

//If you need to add a single key value from one object to another object. 
//Pass in arry1 = main array of data what is being returned and accepting the value
//arry2 = array of obj that contain field you want share
//arryKey1 & arryKey2 pass in unique key values that will join two objects together keyToadd is the key name of the value you want to share
const addSingleKey = (arry1, arryKey1, arry2, arryKey2, keyToAdd) => {
  //console.log(1, arryCol1, 2,arryCol2 )
  let val1 = arryKey1;
  let val2 = arryKey2;
  let keyField = keyToAdd;
  const x = arry1.map(obj => {
    const join = arry2.find(tmp => tmp[val2] === obj[val1])

    
    if (join){ 
    return {  ...obj, Qty:join[keyField]}
    } 
  })
  return x; 
}

export{
       spellCheck,
       quickSearchString,
       cpqSearchString,
       uniqVals, 
       cpqSearchStringMobile,
       uniqPromo,
       addSingleKey
      }


///SEARCH STRING FOR ADDING IN STATUS FOR SEARCH
    //   let searchString = `FIND '${term}' IN ALL FIELDS RETURNING Tag__c(id, Tag_Description__c, Search_Slug_2__c,`
    //   +`Product__c, Product_Name__c, Product__r.Temp_Unavailable__c,Product__r.Temp_Mess__c, ATS_Score__c, Stock_Status__c, `
    //   +`W_Focus_Product__c, W_Product_Profitability__c, W_Program_Score__c, W_Inventory_Score__c, Floor_Price__c,`
    //   +`Product__r.Total_Product_Items__c,Product__r.Floor_Type__c, Product_Code__c where product__r.IsActive = true and Tag_Status__c = 'Active'`;
    //   stock != null ? searchString += `and Stock_Status__c  = '${stock}' order by ATS_Score__c desc nulls last)` :searchString +=` order by ATS_Score__c desc nulls last)`
    // return searchString; 
